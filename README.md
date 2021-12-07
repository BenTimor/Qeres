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

**Note2:** Right now if you don't change your parameters values (as explained at **The Qeres object** part) you can only pass `string` parameters **directly** to the function. 

But, You can pass `object` paremters by setting them in Query Variables (as explained at **Query Variables** part) or pass any other type which's returned from Qeres data methods by passing it into query variable.

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
		"multi": {
			error: "The method can't be accessed. You may be able to access this method in a different way",
			status: 403
		}
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

### Accessing Objects

Sometimes you get an object from the API and you don't want the full object. In this case, you can specify what you want to get.
For example, lets say we have this method, which returns text, status and moreInfo:

    @Qeres.data
    textAndStatus() {
        return {
            text: "BANANA",
            status: 200,
            moreInfo: {
                hello: "World",
                world: "Hello",
            }
        };
    }

If we call this method, this is how our Qeres response gonna look like:

	{
	    "textAndStatus": {
	        "text": "BANANA",
	        "status": 200,
	        "moreInfo": {
	            "hello": "World",
	            "world": "Hello"
	        }
	    }
	}

But now we want only the `text` and `hello`. Because honestly, Who cares about statuses and the world? We can do it like this:

	{
	    "{text, moreInfo.hello}": "textAndStatus()"
	}

And then we're gonna get this reponse:

	{
	    "text": "BANANA",
	    "hello": "World"
	}


### Query Variables

To reduce the amount of requests to the server as much as possible, You can store variables in the query itself. This way you won't have to get information from the server and then send it again for another method. For example, Lets say we have those `hello` and `world` methods:

	export class RootAPI {
	    @Qeres.data
	    world() {
	        return "WORLD";
	    }

	    @Qeres.data
	    hello(who: string) {
	        return `HELLO ${who}`;
	    }
	}

We want the server to return us `"HELLO WORLD"`. Instead of requesting the `world` method and then sending another request for the `hello` method, we can do it like this:

	{
	    "temp": "world()",
	    "theMessageIWanted": "hello(${temp})"
	}

And then the response is going to be:

	{
	    "temp": "WORLD",
	    "theMessageIWanted": "HELLO WORLD"
	}

Additionally, We can just set custom variables (without calling method) by putting `$` before the variable name. Those variables can be both object typed and string typed, like this:

	{
	    "$stringVariable": "myVar",
	    "$objectVariable": {
	        "something": "1"
	    },
	    "theMessageIWanted": "hello(${stringVariable})
	}

**Note:** You have to create the variable you want to use **before** you use it.

### Custom Errors

If you want to throw an error and send it to the client, You have to create a custom error by extending `QeresError` object. You can do it like this:

	class WrongPassword extends QeresError {
		constructor(public username  /* Additional fields */) {
			super("You used the wrong password, try again"  /* Message */, 401  /* Status */);
		}
	}

And then you can use it inside a Qeres method like this:

	@Qeres.data
	login(username, password) {
		// LOGIC
		throw new WrongPassword(username);
	}

### The Qeres object

In Qeres, everything happens inside its object. It's done like this because we want to allow you to use multiple Qeres objects for different API endpoints when needed.

When we create the Qeres object, we have to tell Qeres what root methods we have. This is how it looks:

	const qeres = new Qeres(new RootAPI());

Now, Qeres is going to allow the user to access only "termsOfUse" and "math" methods. Unless you use a *path* method (like math), And than it allows you to access the object's functions.

Additionally, You can parse the parameters values who enter into Qeres before passing them into the function by passing a second parameter to the Qeres constructor. 

For example, If I want to convert every string that starts with `+` to number, I can do it like this:

	function parser(value: string | object) {
	    if (typeof value === "string") {
	        if (value.startsWith("+")) {
	            return +value;
	        }
	    }
	    // If we return undefined, It's gonna use value as is
	}

	const qeres = new Qeres(new Root(), parser);

And then the request is going to look like this:

	{
	    "num1": "+1",
	    "sum": "add(${num1}, +2)"
	}

Then sum is going to be equal to 3 even if `add` wouldn't convert its parameters to number.

### Handling Requests

Once you have the qeres object, it's easy to handle requests. All you have to do is something like this:

	app.post('/', async (req, res) => {
		res.json(await qeres.handleRequest(req.body));
	});

**Note:** "req.body" must be a JSON object. If you use express, you may have to add bodyparse for this to be possible (Something like `app.use(bodyParser.json());`)