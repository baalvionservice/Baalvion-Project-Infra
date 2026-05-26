import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useEnterprise } from "@/contexts/EnterpriseContext";
import { useNavigate } from "react-router-dom";
import {
  Rocket,
  Search,
  BarChart3,
  Megaphone,
  TrendingUp,
  Shield,
  Globe,
  Smartphone,
  Server,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
  X,
} from "lucide-react";

const useCases = [
  { id: "scraping", label: "Web Scraping", icon: Search, description: "Data extraction & crawling" },
  { id: "seo", label: "SEO Monitoring", icon: BarChart3, description: "Rank tracking & SERP analysis" },
  { id: "ads", label: "Ad Verification", icon: Megaphone, description: "Ad fraud & compliance" },
  { id: "market", label: "Market Research", icon: TrendingUp, description: "Price & competitor monitoring" },
  { id: "security", label: "Security Testing", icon: Shield, description: "Penetration testing & audits" },
];

const proxyTypes = [
  { id: "Residential", label: "Residential Proxies", icon: Globe, description: "Real ISP IPs, highest anonymity" },
  { id: "Mobile", label: "Mobile Proxies", icon: Smartphone, description: "4G/5G carrier IPs, best for mobile apps" },
  { id: "Datacenter", label: "Datacenter Proxies", icon: Server, description: "Fast & affordable, ideal for speed" },
];

const steps = [
  { id: 0, title: "Welcome", description: "Get started with Baalvion" },
  { id: 1, title: "Use Case", description: "What will you use proxies for?" },
  { id: 2, title: "Proxy Type", description: "Choose your proxy type" },
  { id: 3, title: "First Proxy", description: "Create your first configuration" },
  { id: 4, title: "Complete", description: "You're all set!" },
];

export function OnboardingWizard() {
  const { onboarding, setOnboardingStep, updateOnboardingData, completeOnboarding, skipOnboarding } = useEnterprise();
  const navigate = useNavigate();
  const [proxyConfig, setProxyConfig] = useState({
    country: "US",
    rotation: "rotating",
    protocol: "HTTP/HTTPS",
  });

  if (onboarding.completed || onboarding.skipped) return null;

  const currentStep = onboarding.currentStep;
  const progress = (currentStep / 4) * 100;

  const handleNext = () => {
    if (currentStep < 4) {
      setOnboardingStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setOnboardingStep(currentStep - 1);
    }
  };

  const handleSelectUseCase = (useCase: string) => {
    updateOnboardingData({ useCase });
    handleNext();
  };

  const handleSelectProxyType = (proxyType: string) => {
    updateOnboardingData({ proxyType });
    handleNext();
  };

  const handleCreateProxy = () => {
    updateOnboardingData({ firstProxy: true });
    handleNext();
  };

  const handleComplete = () => {
    completeOnboarding();
    navigate("/app/dashboard");
  };

  const handleSkip = () => {
    skipOnboarding();
    navigate("/app/dashboard");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Setup Progress</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
              Skip setup
              <X className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`text-xs ${step.id <= currentStep ? "text-primary" : "text-muted-foreground"}`}
              >
                {step.id < currentStep ? <Check className="w-3 h-3" /> : null}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-border/50 shadow-2xl">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {/* Step 0: Welcome */}
              {currentStep === 0 && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center space-y-6"
                >
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Rocket className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Welcome to Baalvion NetStack</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Let's set up your proxy network in just a few steps. We'll help you configure everything based on your needs.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="p-4 rounded-lg bg-secondary/30 text-center">
                      <Globe className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium">195+ Countries</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/30 text-center">
                      <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium">99.9% Uptime</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/30 text-center">
                      <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium">Enterprise Security</p>
                    </div>
                  </div>
                  <Button variant="hero" size="lg" onClick={handleNext} className="mt-6">
                    Get Started
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* Step 1: Use Case */}
              {currentStep === 1 && (
                <motion.div
                  key="usecase"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">What's your primary use case?</h2>
                    <p className="text-muted-foreground">We'll optimize your experience based on your needs.</p>
                  </div>
                  <div className="grid gap-3">
                    {useCases.map((useCase) => (
                      <button
                        key={useCase.id}
                        onClick={() => handleSelectUseCase(useCase.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50 hover:bg-primary/5 ${
                          onboarding.useCase === useCase.id
                            ? "border-primary bg-primary/10"
                            : "border-border/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                            <useCase.icon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{useCase.label}</p>
                            <p className="text-sm text-muted-foreground">{useCase.description}</p>
                          </div>
                          {onboarding.useCase === useCase.id && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" onClick={handleBack}>
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Proxy Type */}
              {currentStep === 2 && (
                <motion.div
                  key="proxytype"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Choose your proxy type</h2>
                    <p className="text-muted-foreground">Select the type that best fits your use case.</p>
                  </div>
                  <div className="grid gap-4">
                    {proxyTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleSelectProxyType(type.id)}
                        className={`w-full p-6 rounded-xl border-2 text-left transition-all hover:border-primary/50 hover:bg-primary/5 ${
                          onboarding.proxyType === type.id
                            ? "border-primary bg-primary/10"
                            : "border-border/50"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                            <type.icon className="w-7 h-7 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-lg">{type.label}</p>
                              {type.id === "Residential" && (
                                <Badge variant="info">Recommended</Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground">{type.description}</p>
                          </div>
                          {onboarding.proxyType === type.id && (
                            <Check className="w-6 h-6 text-primary shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" onClick={handleBack}>
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: First Proxy Configuration */}
              {currentStep === 3 && (
                <motion.div
                  key="config"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Configure your first proxy</h2>
                    <p className="text-muted-foreground">We'll create a proxy configuration for you.</p>
                  </div>
                  <div className="space-y-4 p-6 rounded-xl bg-secondary/30 border border-border/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium block mb-2">Target Country</label>
                        <select
                          value={proxyConfig.country}
                          onChange={(e) => setProxyConfig({ ...proxyConfig, country: e.target.value })}
                          className="w-full p-3 rounded-lg bg-background border border-border"
                        >
                          <option value="US">🇺🇸 United States</option>
                          <option value="GB">🇬🇧 United Kingdom</option>
                          <option value="DE">🇩🇪 Germany</option>
                          <option value="FR">🇫🇷 France</option>
                          <option value="JP">🇯🇵 Japan</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-2">Rotation</label>
                        <select
                          value={proxyConfig.rotation}
                          onChange={(e) => setProxyConfig({ ...proxyConfig, rotation: e.target.value })}
                          className="w-full p-3 rounded-lg bg-background border border-border"
                        >
                          <option value="rotating">Rotating (New IP each request)</option>
                          <option value="sticky-5">Sticky (5 min sessions)</option>
                          <option value="sticky-30">Sticky (30 min sessions)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">Protocol</label>
                      <select
                        value={proxyConfig.protocol}
                        onChange={(e) => setProxyConfig({ ...proxyConfig, protocol: e.target.value })}
                        className="w-full p-3 rounded-lg bg-background border border-border"
                      >
                        <option value="HTTP/HTTPS">HTTP/HTTPS</option>
                        <option value="SOCKS5">SOCKS5</option>
                      </select>
                    </div>
                    <div className="p-4 rounded-lg bg-background border border-border">
                      <p className="text-xs text-muted-foreground mb-2">Preview Configuration:</p>
                      <code className="text-sm font-mono text-primary">
                        {onboarding.proxyType?.toLowerCase()}.baalvion.io:{proxyConfig.country.toLowerCase()}:{proxyConfig.rotation}
                      </code>
                    </div>
                  </div>
                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" onClick={handleBack}>
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button variant="hero" onClick={handleCreateProxy}>
                      Create Proxy
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Complete */}
              {currentStep === 4 && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mx-auto"
                  >
                    <Check className="w-12 h-12 text-success" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">You're all set!</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Your proxy network is configured and ready to use. Head to the dashboard to start using your proxies.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-success/10 border border-success/20 max-w-sm mx-auto">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-success" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">First proxy created!</p>
                        <p className="text-xs text-muted-foreground">
                          {onboarding.proxyType} · {proxyConfig.country} · {proxyConfig.rotation}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="hero" size="lg" onClick={handleComplete} className="mt-6">
                    Go to Dashboard
                    <Sparkles className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
