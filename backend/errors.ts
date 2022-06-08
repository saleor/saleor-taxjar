export class WebhookCreateError extends Error {
    codes: string[];
  
    constructor(message: string, codes: string[]) {
      super(message);
      this.codes = codes;
  
      Object.setPrototypeOf(this, WebhookCreateError.prototype);
    }
  }
