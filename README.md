# Qeres - The easiest and most flexible way to create APIs

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

## Installation
	npm install qeres --save

## How to use Qeres?

### Data Methods

Qeres is method-based. Everything we can request from our API, has to be created as a method.

Additionally, Every method has to be created inside a class (The method can be static). It's because we're going to need to decorate the method, and [JavaScript won't allow us to decorate functions outside of a class](https://github.com/Microsoft/TypeScript/issues/3661). 

Now lets say we want to allow the user to request our terms of use. We'll create a class with a method which returns our terms of use, Like this:

    class RootAPI {
	    @Qeres.data
	    static termsOfUse() {
		    return "We're the champions";
	    }
    } 

This is called a root method, Because it can be accessed directly through our API. And it's a data method, which tells us it can't be used to access another methods (Next title we're going to see the opposite example!) 

**Request example:**

	{
		"tos": "termsOfUse()"
	}

**Response example:**

	{
		"tos": "We're the champions"
	}

**Note:** In Qeres, we tell the server how to name the value we want to get, and tell it what function it has to run to get this value. In our example, we told the server *"Hey! Get the return value of `termsOfUse()` and name it `'tos'` in the response"*

### Path Methods

Sometimes we want to return an object from a method, And let the user use its methods. 

For example lets say we have a "Math" class which allows the user to use math methods on two numbers. Here's our class:

	class Math {
		constructor(private a: number, private b: number) {
			//
		}

		@Qeres.data
		plus() {
			return this.a+this.b;
		}

		@Qeres.data
		minus() {
			return this.a-this.b;
		}

		multiplication() {
			return this.a*this.b;
		}
	}

**Note:** We don't have `@Qeres.data` on our multipication method, so the user is going to get an error if he try to access it.

Now, lets create a new method in our RootAPI class which returns the Math object:

	@Qeres.path
	static math(a: string, b: string) {
		return new Math(+a, +b);
	}

**Note2:** Right now Qeres can only supply string typed parameters, so we have to convert the parameters ourselves.

**Request example:**

	{
		math(5, 10): {
			"plus": "plus()",
			"minus": "minus()",
			"multi": "multiplication()"
		}
	}

**Response example:**

	{
		"plus": 15,
		"minus": -5,
		"multi": "[Qeres] Error: The statement 'multiplication()' throwed an error: The method can't be accessed. You may be able to access this method in a different way."
	}

**Note:** With path methods, instead of telling the server how to name them, we tell the server what methods we want to get from them. It runs recursively so we can have a method inside a method inside a method...

### Combined Methods

A method can be both *path* and *data* typed. It allows you both to get it's return value and to access its methods.

All we have to do to create a method like this, Is to add both `@Qeres.data` and `@Qeres.path`. This is the example with our math method;

	@Qeres.data
	@Qeres.path
	static math(a: string, b: string) {
		return new Math(+a, +b);
	}

### The Qeres object

In Qeres, everything happens inside its object. It's done like this because we want to allow you to use multiple Qeres objects for different API endpoints when needed.

When we create the Qeres object, we have to tell Qeres what root methods we have. This is how it looks:

	const qeres = new Qeres(new RootAPI());

Now, Qeres is going to allow the user to access only "termsOfUse" and "math" methods. Unless you use a *path* method (like math), And than it allows you to access the object's functions.

### Handling Requests

Once you have the qeres object, it's easy to handle requests. All you have to do is something like this:

	app.post('/', async (req, res) => {
		res.json(await qeres.handleRequest(req.body));
	});

**Note:** "req.body" must be a JSON object. If you use express, you may have to add bodyparse for this to be possible (Something like `app.use(bodyParser.json());`)
