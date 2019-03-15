import path from 'path'
import fs from 'fs-extra'

export const makeWebhookRoute = (settings) => {
    return (req, res) => {
        console.log('POST!')

        let fixtureName = `${req.headers['x-github-event']}`
        switch (req.headers['x-github-event']) {
            case 'issues':
                fixtureName += `--${req.body.action}`
                break
        }

        // Change in comment
        if (fixtureName === 'issues--edited') {
            try {
                if (req.body.comment.id) {}
                fixtureName += '--comment'
            } catch (err) {}
        }

        fs.writeJSONSync(path.join(__dirname, 'fixtures_new', `${fixtureName}.json`), {
            request: {
                url: req.protocol + '://' + req.get('host') + req.originalUrl,
                from: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            },
            headers: req.headers,
            body: req.body,
        }, { spaces: 4 })

        res.send({
            settings,
            body: req.body,
            headers: req.headers,
        })
    }
}
