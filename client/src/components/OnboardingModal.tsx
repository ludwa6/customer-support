import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Database, AlertCircle } from "lucide-react";

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [databasesDetected, setDatabasesDetected] = useState(false);
  const [configExists, setConfigExists] = useState(false);

  // Check for onboarding status
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding") === "true";
    if (!hasSeenOnboarding) {
      setOpen(true);
      
      // Check for database detection status
      fetch("/api/notion-status")
        .then(res => res.json())
        .then(data => {
          setDatabasesDetected(data.databasesDetected);
          setConfigExists(data.configExists);
        })
        .catch(err => {
          console.error("Error checking notion status:", err);
        });
    }
  }, []);

  // Mark onboarding as seen when closed
  const handleClose = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setOpen(false);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Welcome to SerenityFlow Documentation Portal</DialogTitle>
          <DialogDescription>
            Let's get your Notion integration set up for a seamless experience.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="py-4">
            <h3 className="text-lg font-medium mb-2">Step 1: Notion Integration</h3>
            <p className="mb-4">
              SerenityFlow uses Notion as a database to store your documentation and support tickets.
            </p>
            <div className="rounded-md bg-muted p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  {process.env.NOTION_INTEGRATION_SECRET ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    {process.env.NOTION_INTEGRATION_SECRET
                      ? "Notion Integration Secret: ✓ Found"
                      : "Notion Integration Secret: Not set"}
                  </h3>
                  {!process.env.NOTION_INTEGRATION_SECRET && (
                    <div className="mt-2 text-sm">
                      <p>Add NOTION_INTEGRATION_SECRET to your environment variables.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-md bg-muted p-4 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  {process.env.NOTION_PAGE_URL ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    {process.env.NOTION_PAGE_URL
                      ? "Notion Page URL: ✓ Found"
                      : "Notion Page URL: Not set"}
                  </h3>
                  {!process.env.NOTION_PAGE_URL && (
                    <div className="mt-2 text-sm">
                      <p>Add NOTION_PAGE_URL to your environment variables.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="py-4">
            <h3 className="text-lg font-medium mb-2">Step 2: Database Detection</h3>
            <p className="mb-4">
              SerenityFlow can work with existing databases in your Notion page
              or create new ones if needed.
            </p>

            <div className="rounded-md bg-muted p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  {databasesDetected ? (
                    <Database className="h-5 w-5 text-green-500" />
                  ) : (
                    <Database className="h-5 w-5 text-amber-500" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    {databasesDetected
                      ? "Existing databases: ✓ Found"
                      : "Existing databases: Not found"}
                  </h3>
                  <div className="mt-2 text-sm">
                    {databasesDetected ? (
                      <p>
                        We found existing databases in your Notion page.
                        {configExists
                          ? " Configuration is set up properly."
                          : " Run 'node auto-setup.js' to configure them."}
                      </p>
                    ) : (
                      <p>
                        No existing databases found. Run 'node server/setup-notion.ts'
                        to create new ones.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-md bg-muted p-4 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  {configExists ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    {configExists
                      ? "Configuration: ✓ Set up"
                      : "Configuration: Needs setup"}
                  </h3>
                  {!configExists && (
                    <div className="mt-2 text-sm">
                      <p>
                        {databasesDetected
                          ? "Run 'node auto-setup.js' to configure existing databases."
                          : "After creating databases, add NOTION_CONFIG_PATH=./notion-config.json to your environment variables."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="py-4">
            <h3 className="text-lg font-medium mb-2">Ready to Go!</h3>
            <p className="mb-4">
              You're all set to use the SerenityFlow Documentation Portal.
            </p>
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-4">
                <h4 className="font-medium">Need Help?</h4>
                <p className="mt-1 text-sm">
                  Check the README.md file for detailed setup instructions
                  or run 'node setup.js' for an interactive setup process.
                </p>
              </div>
              <div className="rounded-md bg-muted p-4">
                <h4 className="font-medium">Quick Commands</h4>
                <ul className="mt-1 text-sm space-y-1">
                  <li>• node setup.js - Interactive setup</li>
                  <li>• node auto-setup.js - Automatic database detection</li>
                  <li>• node server/setup-notion.ts - Create new databases</li>
                  <li>• node use-existing-db.js - Map existing databases</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <Button onClick={handleNext}>
            {step < 3 ? "Next" : "Get Started"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}