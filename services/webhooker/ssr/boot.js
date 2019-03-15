import path from 'path'
import fs from 'fs-extra'
import uuid from 'uuid/v4'
import glob from 'glob'
import * as config from '@marcopeg/utils/lib/config'
import { logInfo, logVerbose } from 'services/logger'
import {
    createHook,
    registerAction,
    createHookApp,
    logBoot,
    SETTINGS,
    FINISH,
} from '@marcopeg/hooks'

const services = [
    require('./services/env'),
    require('./services/logger'),
    require('./services/jwt'),
    require('./services/express'),
]

const features = [
    require('./features/status'),
    require('./features/webhooks'),
]

const getJwtSecret = () => {
    const secret = config.get('JWT_SECRET', '---')
    if (secret !== '---') {
        return secret
    }

    const generatedSecret = uuid()
    logInfo('')
    logInfo('WARNING:')
    logInfo('Webhooker was started without a JWT_SECRET env var.')
    logInfo('The following value is being generated for this run:')
    logInfo(generatedSecret)
    logInfo('')
    return generatedSecret
}

registerAction({
    hook: SETTINGS,
    name: '♦ boot',
    handler: async ({ settings }) => {
        // --- CONFIG FILE
        const configFileDefaultPath = path.join(process.cwd(), 'webhooker-config.json')
        settings.webhookerc = {}
        settings.configFilePath = config.get('WEBHOOKER_CONFIG_FILE', configFileDefaultPath)

        try {
            settings.webhookerc = await fs.readJSON(settings.configFilePath)
            console.log('***********', settings)
        } catch (err) {
            logVerbose(`[config] could not read from "webhooker-config.json": ${settings.configFilePath} - ${err.message}`)
            settings.webhookerc = {}
        }

        settings.jwt = {
            secret: getJwtSecret(),
        }

        // ---- EXPRESS
        settings.express = {
            nodeEnv: config.get('NODE_ENV'),
            port: '8080',
        }

        // ---- EXTENSIONS

        // development extensions from a local folder
        // @NOTE: extensions should be plain NodeJS compatible, if you want to use
        // weird ES6 syntax you have to transpile your extension yourself
        const devExtensions = process.env.NODE_ENV === 'development'
            ? glob
                .sync(path.resolve(__dirname, 'extensions', 'dev', '[!_]*', 'index.js'))
            : []

        // community extensions from a mounted volume
        // @NOTE: extensions should be plain NodeJS compatible, if you want to use
        // weird ES6 syntax you have to transpile your extension yourself
        const communityExtensionsPath = config.get('COMMUNITY_EXTENSIONS', '/var/lib/webhooker/extensions')
        const communityExtensions = glob
            .sync(path.resolve(communityExtensionsPath, '[!_]*', 'index.js'))

        // core extensions, will be filtered by environment variable
        const rcExtensions = (settings.webhookerc.extensions || ['---']).filter(e => e.substr(0, 1) !== '#').join('|') || '---'
        const enabledExtensions = config.get('CORE_EXTENSIONS', rcExtensions)
        const coreExtensions = glob
            .sync(path.resolve(__dirname, 'extensions', 'core', `@(${enabledExtensions})`, 'index.js'))

        // register extensions
        const extensions = [ ...devExtensions, ...coreExtensions, ...communityExtensions ]
        for (const extensionPath of extensions) {
            const extension = require(extensionPath)
            const extensionHandler = extension.register || extension.default
            if (extensionHandler) {
                logInfo(`activate extension: ${extensionPath}`)
                await extensionHandler({
                    registerAction,
                    createHook,
                    settings: { ...settings },
                })
            }
        }
    },
})

registerAction({
    hook: FINISH,
    name: '♦ boot',
    handler: () => logBoot(),
})

export default createHookApp({
    settings: {},
    services,
    features,
})
