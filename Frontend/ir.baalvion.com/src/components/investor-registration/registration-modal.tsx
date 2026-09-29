"use client";

import { useState } from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import CreateAccountStep from "./steps/create-account-step";
import VerifyEmailStep from "./steps/verify-email-step";
import MfaStep from "./steps/mfa-step";
import ProfileStep from "./steps/profile-step";
import KycAmlStep from "./steps/kyc-aml-step";
import AccreditationStep from "./steps/accreditation-step";
import NdaStep from "./steps/nda-step";
import CompletionStep from "./steps/completion-step";
import ProgressIndicator from "./progress-indicator";
import SpvDeclarationStep from "./steps/spv-declaration-step";

type RegistrationModalProps = {
  closeModal: () => void;
  flowType: "phase1" | "phase2";
};

export default function RegistrationModal({ closeModal, flowType }: RegistrationModalProps) {
  const TOTAL_STEPS = flowType === "phase1" ? 7 : 8;
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});

  const handleNext = (data?: any) => {
    if (data) {
      setFormData((prev) => ({ ...prev, ...data }));
    }
    if (step < TOTAL_STEPS) {
      setStep((prev) => prev + 1);
    } else {
      // If it's the last step, call the completion logic
      if (flowType === "phase1" && step === 7) {
        setStep(TOTAL_STEPS + 1);
      } else if (flowType === "phase2" && step === 8) {
        setStep(TOTAL_STEPS + 1);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const renderStep = () => {
    // A step beyond the total shows the completion screen
    if (step > TOTAL_STEPS) {
       return <CompletionStep closeModal={closeModal} flowType={flowType} />;
    }

    switch (step) {
      case 1:
        return <CreateAccountStep onNext={handleNext} />;
      case 2:
        return <VerifyEmailStep onNext={handleNext} />;
      case 3:
        return <MfaStep onNext={handleNext} />;
      case 4:
        return <ProfileStep onNext={handleNext} onBack={handleBack} />;
      case 5:
        return <KycAmlStep onNext={handleNext} onBack={handleBack} />;
      case 6:
        return <AccreditationStep onNext={handleNext} onBack={handleBack} />;
      case 7:
        if (flowType === 'phase2') {
          return <NdaStep onNext={() => setStep(8)} onBack={handleBack} />;
        }
        return <NdaStep onNext={handleNext} onBack={handleBack} />;
      case 8:
        return <SpvDeclarationStep onNext={handleNext} onBack={handleBack} />;
      default:
        return null;
    }
  }
  
  const currentDisplayStep = step > TOTAL_STEPS ? TOTAL_STEPS : step;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-center text-2xl font-bold">
          {flowType === "phase1" ? "Become an Investor" : "Phase 2 SPV Onboarding"}
        </DialogTitle>
        <DialogDescription className="text-center">
          {flowType === "phase1"
            ? "Complete the steps below to apply for investment access."
            : "Complete the secure steps to access your SPV documentation."}
        </DialogDescription>
        <ProgressIndicator currentStep={currentDisplayStep} totalSteps={TOTAL_STEPS} />
      </DialogHeader>
      <div className="py-4">
        {renderStep()}
      </div>
    </>
  );
}
