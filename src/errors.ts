import { Qeres } from ".";

export class QeresError {
    // Regex
    static INVALID_STATEMENT = QeresError.new("Invalid statement: The statement should be a call for a method");

    // Methods
    static METHOD_NOT_FOUND = QeresError.new("The method is not found");
    static METHOD_ACCESS = QeresError.new("The method can't be accessed. You may be able to access this method in a different way.");
    static METHOD_ERRPR = QeresError.new("The method is accessed and found, but it throwed an error");

    // Class itself
    public message: string;

    private constructor(message: string, statement: string, error?: any) {
        this.message = `[Qeres] Error: The statement '${statement}' throwed an error: ${message}${error ? ' | ' + error : ''}`;
    }

    private static new(message: string): ((statement: string, error?: any) => QeresError) {
        return (statement: string, error?: any) => new QeresError(message, statement, error);
    }

    toString() {
        return this.message;
    }

    toJSON() {
        return this.toString();
    }
}
