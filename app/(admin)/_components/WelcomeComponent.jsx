import { Card, CardContent } from "@/components/ui/card";
import React from "react";

const WelcomeComponent = () => {
  return (
    <Card className="w-full">
      <CardContent>
        <h1 className="text-xl font-semibold">Welcome to the Admin Dashboard</h1>
      </CardContent>
    </Card>
  );
};

export default WelcomeComponent;
