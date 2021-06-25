import { QeresError, QeresErrors } from "./errors";
export * from "./errors";

/**
 * Qeres is a new way to create APIs easily. It's more flexible than REST, and more easy than GraphQL.
 */
export class Qeres {
    static readonly toParamsRegex = /\w+\(/;
    static readonly commasRegex = /(?<!\\),/g;
    static readonly stripRegex = /^\s+|\s+$/g;

    private funcs = {};

    /**
     * @param rootAPI An object which is used as the first "endpoint" of the API.
     *                The user will be able to call directly only to the methods of the rootAPI object.
     */
    constructor(private readonly rootAPI: any) {
        if (!(rootAPI instanceof QeresError)) {
            this.getMethods().forEach(func => {
                this.funcs[func.name] = func;
            });
        }
    }

    private getMethods() {
        // Getting all methods
        const objFuncs = Object.getOwnPropertyNames(this.rootAPI.constructor.prototype);

        // returning the functions themself
        return objFuncs.map(funcName => {
            const rootAPI = this.rootAPI;

            function func(...args) {
                return rootAPI[funcName](...args);
            }

            Object.defineProperty(func, 'name', {
                value: funcName,
                configurable: true,
            })

            func.allowQeresData = rootAPI[funcName].allowQeresData;
            func.allowQeresPath = rootAPI[funcName].allowQeresPath;

            return func;
        });
    }

    private async parseFunction(func: string, validateType: "data" | "path") {
        // If we throwed an error before, we want to keep it
        // This way every variable is "inheriting" the error before
        if (this.rootAPI instanceof QeresError) {
            return this.rootAPI;
        }

        const matches = Qeres.toParamsRegex.exec(func);
        if (!matches) {
            return QeresErrors.INVALID_STATEMENT;
        }

        const executableFunction = this.funcs[matches[0].replace("(", "")];

        if (!executableFunction) {
            return QeresErrors.METHOD_NOT_FOUND;
        }

        // Validate type
        if (!((validateType === "data" && executableFunction.allowQeresData) || (validateType === "path" && executableFunction.allowQeresPath))) {
            return QeresErrors.METHOD_ACCESS;
        }

        const params = func.replace(matches[0], "").replace(/\)$/, "") // Getting the params as string by replacing the first match ( 'name(' ) and replacing the last ')'
            .split(Qeres.commasRegex).map(v => v.replace(Qeres.stripRegex, '')); // Splitting params to array & stripping the values        

        try {
            return await executableFunction(...params);
        }
        catch (error) {
            if (error instanceof QeresError) {
                return error;
            }
            console.error(error);
            return QeresErrors.METHOD_ERROR;
        }
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
                const tempQeres = new Qeres(await this.parseFunction(key, "path"));

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