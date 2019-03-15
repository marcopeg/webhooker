import bodyParser from 'body-parser'
import { EXPRESS_MIDDLEWARE, EXPRESS_ROUTE } from 'services/express/hooks'
import { FEATURE_NAME } from './hooks'
import { makeWebhookRoute } from './webhook-route'

export const register = ({ registerAction, settings }) => {
    registerAction({
        hook: EXPRESS_MIDDLEWARE,
        name: FEATURE_NAME,
        trace: __filename,
        handler: ({ app }) =>
            app.use(bodyParser.json()),
    })
    registerAction({
        hook: EXPRESS_ROUTE,
        name: FEATURE_NAME,
        trace: __filename,
        handler: ({ app }) =>
            app.post('/', makeWebhookRoute(settings)),
    })

}