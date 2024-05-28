export class InMemoryLogger {
    private logs: { service: string, message: string, timestamp: Date, type: string }[] = [];

    log(service: string, message: string, type: string): void {
        this.logs.push({ service, message, timestamp: new Date(), type });
    }

    getLogs(service?: string): { service: string, message: string, timestamp: Date, type: string }[] {
        if (service) {
            return this.logs.filter(log => log.service === service);
        }
        return this.logs;
    }
}

export const logger = new InMemoryLogger();
