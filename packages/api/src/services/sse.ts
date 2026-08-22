import { Response } from 'express';

export interface SSEClient {
  id: string;
  res: Response;
  userId: string;
  role: string;
}

class SSEService {
  private clients: SSEClient[] = [];

  public addClient(userId: string, role: string, res: Response) {
    const id = Date.now().toString() + Math.random().toString();
    const client: SSEClient = { id, res, userId, role };
    this.clients.push(client);

    res.on('close', () => {
      this.clients = this.clients.filter(c => c.id !== id);
    });
  }

  public broadcastToAdmins(event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach(c => {
      if (c.role === 'super_admin' || c.role === 'order_manager') {
        c.res.write(payload);
      }
    });
  }

  public broadcastToCustomer(customerId: string, event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach(c => {
      if (c.userId === customerId) {
        c.res.write(payload);
      }
    });
  }

  public broadcastToAll(event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach(c => {
      c.res.write(payload);
    });
  }
}

export const sse = new SSEService();
