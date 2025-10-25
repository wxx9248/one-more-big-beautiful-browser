import { Button } from "@/src/components/ui/button";
import "./App.css";
import { Card } from "@/src/components/ui/card";

function App() {
  return (
    <>
      {/* <Button variant="ghost">Click me</Button> */}
      <p className="text-teal-600 text-lg font-bold">text</p>
      <Card>
        test
        <Button variant="outline">Click me</Button>
      </Card>
    </>
  );
}

export default App;
