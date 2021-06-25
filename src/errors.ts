export class QeresError {
    constructor(public error?: string, public status?: number) {
        //
    }
}

export namespace QeresErrors {
    export const INVALID_STATEMENT = new QeresError("Invalid statement: The statement should be a call for a method", 400);
    export const METHOD_NOT_FOUND = new QeresError("The method is not found", 404);
    export const METHOD_ACCESS = new QeresError("The method can't be accessed. You may be able to access this method in a different way.", 403);
    export const METHOD_ERROR = new QeresError("The method is accessed and found, but it throwed an unknown error", 500);

}