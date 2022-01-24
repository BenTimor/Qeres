import { QeresError, QeresErrors } from "./errors";
export * from "./errors";

/**
 * Qeres is a new way to create APIs easily. It's more flexible than REST, and more easy than GraphQL.
 */
export class Qeres {
    static readonly commasRegex = /(?<!\\),/g;
    static readonly stripRegex = /^\s+|\s+$/g;
    static readonly queryVariablesRegex = /(?<!\\)\${(.+)}/g;
    static readonly objVarNameRegex = /{(.+)}/g;
    static readonly toParamsRegex = /\w+\(/;

    private funcs = {};

    /**
     * @param rootAPI An object which is used as the first "endpoint" of the API.
     *                The user will be able to call directly only to the methods of the rootAPI object.
     */
    constructor(private readonly rootAPI: any, private readonly onParamValue?: (value: string | object) => any) {
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

    private async parseFunction(func: string, validateType: "data" | "path", results: any) {
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

        let params = func.replace(matches[0], "").replace(/\)$/, "") // Getting the params as string by replacing the first match ( 'name(' ) and replacing the last ')'
            .split(Qeres.commasRegex).map(v => v.replace(Qeres.stripRegex, '')) // Splitting params to array & stripping the values
            .map(v => {
                const withRegex = Qeres.queryVariablesRegex.exec(v);
                // Resetting regex because it 'stateful'
                Qeres.queryVariablesRegex.lastIndex = 0;

                return withRegex ? results[withRegex[1]] : v;
            }); // Allowing query varialbes

        try {
            // Letting onParamValue to change params if needed
            // Calling it inside try/catch to allow them throw QeresError and not break the API in case of function errors
            if (this.onParamValue) {
                params = params.map(v => {
                    const value = this.onParamValue!(v);

                    if (typeof value !== "undefined") {
                        return value;
                    }

                    return v;
                });
            }

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
    async handleRequest(req: any, data?: any): Promise<any> {
        let results = {};

        for (const [key, value] of Object.entries(req)) {
            // Allowing to set variables
            if (key.startsWith("$")) {
                results[key.replace(/\$/, "")] = value;
                continue;
            }

            // If the value is string, We want to parse it like a function
            if (typeof (value) === "string") {
                const temp = await this.parseFunction(value, "data", { ...data, ...results });

                const withRegex = Qeres.objVarNameRegex.exec(key);
                Qeres.objVarNameRegex.lastIndex = 0;

                // It's used for when wanting to split objects, Like "{banana, apple}": "getBananasAndApples()"
                if (withRegex) {
                    const keys = withRegex[1].split(",").map(key => key.replace(Qeres.stripRegex, ""));
                    keys.forEach(fullKey => {
                        const fullKeys = fullKey.split(".");
                        let tempValue = temp;

                        fullKey.split(".").forEach(key => {
                            tempValue = tempValue[key];
                        })

                        results[`${fullKeys.pop()}`] = tempValue;
                    });
                }
                else {
                    results[key] = temp;
                }

            }
            // If the value is object, We want to parse it recursively
            else {
                const tempQeres = new Qeres(await this.parseFunction(key, "path", { ...data, ...results }));

                results = {
                    ...results,
                    ...await tempQeres.handleRequest(value, { ...data, ...results })
                }
            }
        }

        return results;
    }

    // Decorators

    static data(target, key, _descriptor) {
        target[key].allowQeresData = true;
    }

    static path(target, key, _descriptor) {
        target[key].allowQeresPath = true;
    }
}