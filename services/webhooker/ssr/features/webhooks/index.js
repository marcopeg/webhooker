import { EXPRESS_ROUTE } from 'services/express/hooks'
import { FEATURE_NAME } from './hooks'
import { makeWebhookRoute } from './webhook-route'

export const register = ({ registerAction, settings }) =>
    registerAction({
        hook: EXPRESS_ROUTE,
        name: FEATURE_NAME,
        trace: __filename,
        handler: ({ app }) =>
            app.post('/', makeWebhookRoute(settings)),
    })
