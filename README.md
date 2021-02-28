# Qeres - The easiers and most flexible way to create APIs

## What is Qeres?

Qeres is a new way to create web-APIs, similarly to REST or GraphQL. Qeres was created with 3 main goals:

 - Flexibility
 - Easy to use / Beginner-friendly
 - Fast

Lets just see an example of Qeres use. **Here's the request we're sending to the server:**

    {
        "privacy": "privacyTermsOfUse()",
        "token(secret_token123)": {
            "secretData": "data(active-users)",
            "user(BenTimor)": {
                "username": "username()",
                "password": "password()"
            }
        },
        "_": "logToConsole(123)"
    }

**And here's the response:**

    {
        "privacy": "We sell your data to everyone+-",
        "secretData": 100,
        "username": "BenTimor",
        "password": "123AB"
    }

Basically, We're just telling the server how to name our data and what data we need. So if we send a request of `"privacy": "privacyTermsOfUse()"`, we tell the server that we want it to send us the return value of `privacyTermsOfUse()` and name it `"privacy"`.

### WIP - TBC.