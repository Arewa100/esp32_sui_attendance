import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Palette, Type, Moon, Sun, Monitor } from "lucide-react";

type FontFamily = "inter" | "roboto" | "open-sans" | "lato" | "montserrat" | "poppins" | "nunito" | "raleway" | "work-sans" | "system";
type Theme = "light" | "dark" | "system";

const FONT_OPTIONS: { value: FontFamily; label: string; css: string }[] = [
  { value: "inter", label: "Inter", css: "font-inter" },
  { value: "roboto", label: "Roboto", css: "font-roboto" },
  { value: "open-sans", label: "Open Sans", css: "font-open-sans" },
  { value: "lato", label: "Lato", css: "font-lato" },
  { value: "montserrat", label: "Montserrat", css: "font-montserrat" },
  { value: "poppins", label: "Poppins", css: "font-poppins" },
  { value: "nunito", label: "Nunito", css: "font-nunito" },
  { value: "raleway", label: "Raleway", css: "font-raleway" },
  { value: "work-sans", label: "Work Sans", css: "font-work-sans" },
  { value: "system", label: "System Default", css: "font-sans" },
];

export default function Settings() {
  const { toast } = useToast();
  const [fontFamily, setFontFamily] = useState<FontFamily>("system");
  const [theme, setTheme] = useState<Theme>("system");

  // Font loading map for dynamic font loading
  const fontLoadMap: Record<string, string> = {
    "roboto": "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap",
    "open-sans": "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap",
    "lato": "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap",
    "montserrat": "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap",
    "poppins": "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap",
    "nunito": "https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap",
    "raleway": "https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap",
    "work-sans": "https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap",
  };

  // Dynamically load font when selected
  const loadFont = (fontValue: string) => {
    if (fontValue === "system" || fontValue === "inter") return; // Inter is already loaded
    
    const fontUrl = fontLoadMap[fontValue];
    if (!fontUrl) return;

    // Check if font is already loaded
    const existingLink = document.querySelector(`link[data-font="${fontValue}"]`);
    if (existingLink) return;

    // Create and append link element
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontUrl;
    link.setAttribute("data-font", fontValue);
    document.head.appendChild(link);
  };

  // Load saved preferences on mount
  useEffect(() => {
    try {
      const savedFont = localStorage.getItem("app-font-family") as FontFamily | null;
      const savedTheme = localStorage.getItem("app-theme") as Theme | null;
      
      if (savedFont && FONT_OPTIONS.some(f => f.value === savedFont)) {
        setFontFamily(savedFont);
        // Load font if it's not Inter or system
        if (savedFont !== "system" && savedFont !== "inter") {
          loadFont(savedFont);
        }
      }
      if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error("Error loading settings from localStorage:", error);
    }
  }, []);

  // Apply font family to document body
  useEffect(() => {
    const body = document.body;
    const selectedFont = FONT_OPTIONS.find((f) => f.value === fontFamily);
    
    // Load font dynamically if needed
    if (fontFamily !== "system" && fontFamily !== "inter") {
      loadFont(fontFamily);
    }
    
    // Remove all font classes
    FONT_OPTIONS.forEach((font) => {
      if (font.value !== "system") {
        body.classList.remove(`font-${font.value}`);
      }
    });
    
    // Add selected font class
    if (selectedFont && selectedFont.value !== "system") {
      body.classList.add(`font-${selectedFont.value}`);
    }
    // If system, body already has font-sans from CSS, so no action needed
  }, [fontFamily]);

  // Apply theme preference
  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = () => {
      if (theme === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", prefersDark);
      } else {
        root.classList.toggle("dark", theme === "dark");
      }
    };
    
    // Apply theme immediately
    applyTheme();
    
    // Listen for system preference changes if theme is set to "system"
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleChange);
      
      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    }
  }, [theme]);

  const handleFontChange = (value: FontFamily) => {
    setFontFamily(value);
    localStorage.setItem("app-font-family", value);
    toast({
      title: "Font updated",
      description: `Font family changed to ${FONT_OPTIONS.find((f) => f.value === value)?.label}`,
    });
  };

  const handleThemeChange = (value: Theme) => {
    setTheme(value);
    localStorage.setItem("app-theme", value);
    toast({
      title: "Theme updated",
      description: `Theme preference set to ${value === "system" ? "System Default" : value}`,
    });
  };

  const handleReset = () => {
    setFontFamily("system");
    setTheme("system");
    localStorage.removeItem("app-font-family");
    localStorage.removeItem("app-theme");
    toast({
      title: "Settings reset",
      description: "All preferences have been reset to default values",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize your application preferences
        </p>
      </div>

      {/* Appearance Settings */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Selection */}
          <div className="space-y-2">
            <Label htmlFor="theme" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Theme
            </Label>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    System Default
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose your preferred color scheme
            </p>
          </div>

          {/* Font Family Selection */}
          <div className="space-y-2">
            <Label htmlFor="font-family" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Font Family
            </Label>
            <Select value={fontFamily} onValueChange={handleFontChange}>
              <SelectTrigger id="font-family">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    <span style={{ fontFamily: font.css === "font-system" ? "system-ui" : font.label }}>
                      {font.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select your preferred font family for the application
            </p>
            <div className="mt-3 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Preview
                </p>
                <div className="space-y-1">
                  <p className={`text-base leading-relaxed ${fontFamily === "system" ? "font-sans" : `font-${fontFamily}`}`}>
                    Every attendance counts towards success
                  </p>
                  <p className={`text-sm text-muted-foreground ${fontFamily === "system" ? "font-sans" : `font-${fontFamily}`}`}>
                    Track student attendance with blockchain technology
                  </p>
                  <p className={`text-sm text-muted-foreground ${fontFamily === "system" ? "font-sans" : `font-${fontFamily}`}`}>
                    SuiAttend - Secure, Transparent, Reliable
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            <CardTitle>General</CardTitle>
          </div>
          <CardDescription>
            General application settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Reset to Defaults</p>
              <p className="text-xs text-muted-foreground">
                Reset all settings to their default values
              </p>
            </div>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="border-border bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">About Organisation Name</p>
            <p className="text-xs text-muted-foreground">
              Organisation names are stored on-chain and cannot be modified after creation. 
              This ensures data integrity and immutability on the Sui blockchain. 
              If you need to change an organisation name, you'll need to create a new organisation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

