/**
 * Qeres is a new way to create APIs easily. It's more flexible than REST, and more easy than GraphQL.
 */
export class Qeres {
    static readonly toParamsRegex = /\w+\(/;
    static readonly commasRegex = /(?<!\\),/g;
    static readonly stripRegex = /^\s+|\s+$/g;

    private funcs = {};

    /**
     * @param baseFunctions All the functions which can be called by the request (Only relevant for root-calls)
     */
    constructor(...baseFunctions: Function[]) {
        // Parsing the functions array to a dictionary for perfornace reasons
        for (const func of baseFunctions) {
            this.funcs[func.name] = func;
        }
    }

    private async getMethods(func: string) {
        const obj = await this.parseFunction(func, "path");
        // Getting all methods
        const objFuncs = Object.getOwnPropertyNames(obj.constructor.prototype);

        // Filtering constructor & returning the functions themself
        return objFuncs.map(funcName => {
            function func(...args) {
                return obj[funcName](...args);
            }

            Object.defineProperty(func, 'name', {
                value: funcName,
                configurable: true,
            })

            func.allowQeresData = obj[funcName].allowQeresData;
            func.allowQeresPath = obj[funcName].allowQeresPath;

            return func;
        });
    }

    private async parseFunction(func: string, validateType: "data" | "path") {
        const matches = Qeres.toParamsRegex.exec(func);
        if (!matches) {
            return undefined;
        }

        const executableFunction = this.funcs[matches[0].replace("(", "")];

        // Validate type
        if (!((validateType === "data" && executableFunction.allowQeresData) || (validateType === "path" && executableFunction.allowQeresPath))) {
            return undefined;
        }

        const params = func.replace(matches[0], "").replace(/\)$/, "") // Getting the params as string by replacing the first match ( 'name(' ) and replacing the last ')'
            .split(Qeres.commasRegex).map(v => v.replace(Qeres.stripRegex, '')); // Splitting params to array & stripping the values        

        return await executableFunction(...params);
    }

    /**
     * This method is the main method of Qeres. Here you can give Qeres a request, And it'll return you it's response.
     * @param req The request you want to handle
     */
    async handleRequest(req: any): Promise<any> {
        let results = {};

        for (const [key, value] of Object.entries(req)) {
            // If the value is string, We want to parse it like a function
            if (typeof (value) === "string") {                
                results[key] = await this.parseFunction(value, "data");
            }
            // If the value is object, We want to parse it recursively
            else {
                const tempQeres = new Qeres(...await this.getMethods(key));

                results = {
                    ...results,
                    ...await tempQeres.handleRequest(value)
                }
            }
        }        

        return results;
    }

    // Decorators

    static data(target, key, _descriptor: TypedPropertyDescriptor<any>) {
        target[key].allowQeresData = true;
    }

    static path(target, key, _descriptor: TypedPropertyDescriptor<any>) {
        target[key].allowQeresPath = true;
    }
}