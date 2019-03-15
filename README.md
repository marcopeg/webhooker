# What is Webhooker?

Did you ever get the feeling that GitHub webhooks are a bit too generic?  
Like they pack together in one single hook any action regarding PullRequest...

Webooker allow you to parse, filter, split and forward GitHub webhook to your
own detailed actions, all using a simple configuration:

    {
        "https://webhook.n1?token=xxx": {
            "description": "Deploy development on merge pr",
            "matchAll": [
                {
                    "key": "name",
                    "rule": "...regexp..."
                },
                {
                    "key": "payload.field",
                    "rule": "...regexp..."
                },
            ]
        }
    }

