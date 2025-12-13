import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Bell, Shield, Lock, Eye, Monitor, Smartphone, Volume2 } from "lucide-react";

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground">Configure AI proctoring parameters and system preferences.</p>
        </div>

        <Tabs defaultValue="proctoring" className="space-y-6">
          <TabsList>
            <TabsTrigger value="proctoring">AI Proctoring</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security & Access</TabsTrigger>
          </TabsList>

          <TabsContent value="proctoring">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    <CardTitle>Behavioral Analysis</CardTitle>
                  </div>
                  <CardDescription>Configure sensitivity thresholds for suspicious activity detection.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Gaze Tracking</Label>
                      <p className="text-sm text-muted-foreground">Detect when students look away from the screen for {">"}5 seconds.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Multiple Face Detection</Label>
                      <p className="text-sm text-muted-foreground">Flag session if more than one face is detected in the frame.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Audio Analysis</Label>
                      <p className="text-sm text-muted-foreground">Detect speech or unusual background noise levels.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-primary" />
                    <CardTitle>Environment Monitoring</CardTitle>
                  </div>
                  <CardDescription>Settings for multi-device and browser security.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Force Fullscreen Mode</Label>
                      <p className="text-sm text-muted-foreground">Prevent students from exiting fullscreen during exam.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Secondary Device Enforcement</Label>
                      <p className="text-sm text-muted-foreground">Require a mobile camera connection for 360° view.</p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Tab Switching Alerts</Label>
                      <p className="text-sm text-muted-foreground">Instant alert if browser focus is lost.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Alert Preferences</CardTitle>
                <CardDescription>Manage how and when you receive system alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">High Severity Alerts</Label>
                      <p className="text-sm text-muted-foreground">Immediate popup and sound for confirmed cheating behavior.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Summaries</Label>
                      <p className="text-sm text-muted-foreground">Receive a report after each exam session.</p>
                    </div>
                    <Switch />
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
             <Card>
              <CardHeader>
                <CardTitle>Admin Access</CardTitle>
                <CardDescription>Manage administrator credentials and API keys.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid gap-2">
                   <Label>Admin Email</Label>
                   <Input defaultValue="admin@exammatrix.com" />
                 </div>
                 <div className="grid gap-2">
                   <Label>Institution API Key</Label>
                   <div className="flex gap-2">
                     <Input type="password" value="sk_live_892389238923" readOnly className="font-mono" />
                     <Button variant="outline">Regenerate</Button>
                   </div>
                 </div>
                 <Button className="w-fit mt-4">Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
