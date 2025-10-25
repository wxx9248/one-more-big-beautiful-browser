"use client";

import { Card, CardHeader, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";

export default function ChatComponent() {
  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-lg font-semibold">Chat</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <div className="h-32 border border-divider rounded-lg p-3 bg-default-50">
            <p className="text-sm text-default-500">
              Chat messages will appear here...
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              variant="bordered"
              className="flex-1"
            />
            <Button color="primary" size="sm">
              Send
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
