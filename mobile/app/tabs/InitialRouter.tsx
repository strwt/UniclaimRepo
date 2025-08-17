// app/tabs/InitialRouter.tsx
import React from "react";
import Index from "../tabs/index";
import OnBoarding from "./OnBoarding";

type Props = {
  hasSeenOnBoarding: boolean;
  setHasSeenOnBoarding: (v: boolean) => void;
  hasPassedIndex: boolean;
  setHasPassedIndex: (v: boolean) => void;
};

export default function InitialRouter({
  hasSeenOnBoarding,
  setHasSeenOnBoarding,
  hasPassedIndex,
  setHasPassedIndex,
}: Props) {
  if (!hasSeenOnBoarding) {
    return <OnBoarding onFinish={() => setHasSeenOnBoarding(true)} />;
  }

  if (!hasPassedIndex) {
    return <Index onContinue={() => setHasPassedIndex(true)} />;
  }

  return null; // this screen shouldn't show anymore once passed
}
