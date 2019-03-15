
export const makeWebhookRoute = (settings) => {
    return (req, res) => res.send(settings)
}
