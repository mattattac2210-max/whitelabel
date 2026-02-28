import { useState, useCallback } from 'react';
import { SplashScreen } from './splash';
import { TradeSelectScreen } from './trade-select';
import { KmBandScreen } from './km-band';
import VehicleDetails from './vehicle-details';
import Recommendation from './recommendation';
import { SignupScreen, LoginScreen, VerifyScreen, ForgotScreen, PinScreen } from './auth-screens';
import { SetupVehicleScreen, SetupTaxScreen, TrackingMethodScreen, PlanSelectScreen, MatesRatesScreen } from './setup-screens';

type Step =
  | 'splash'
  | 'q1-trade'
  | 'q2-km'
  | 'q3-vehicle'
  | 'recommendation'
  | 'signup'
  | 'login'
  | 'verify'
  | 'forgot'
  | 'pin'
  | 'setup-vehicle'
  | 'setup-tax'
  | 'tracking'
  | 'plan-select'
  | 'mates-rates';

interface UserData {
  trade: string;
  kmBand: string;
  vehicleAge: string;
  vehicleType: string;
  finance: string;
  recommendation: string;
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>('splash');
  const [userData, setUserData] = useState<UserData>({
    trade: '',
    kmBand: '',
    vehicleAge: '',
    vehicleType: '',
    finance: '',
    recommendation: '',
  });

  const update = useCallback((partial: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...partial }));
  }, []);

  const renderStep = () => {
    switch (step) {
      case 'splash':
        return (
          <SplashScreen
            onNext={() => setStep('q1-trade')}
            onLogin={() => setStep('login')}
          />
        );

      case 'q1-trade':
        return (
          <TradeSelectScreen
            onNext={(trade) => { update({ trade }); setStep('q2-km'); }}
            onBack={() => setStep('splash')}
          />
        );

      case 'q2-km':
        return (
          <KmBandScreen
            onNext={(kmBand) => { update({ kmBand }); setStep('q3-vehicle'); }}
            onBack={() => setStep('q1-trade')}
          />
        );

      case 'q3-vehicle':
        return (
          <VehicleDetails
            onNext={(data) => {
              update({ vehicleAge: data.vehicleAge, vehicleType: data.vehicleType, finance: data.finance });
              setStep('recommendation');
            }}
            onBack={() => setStep('q2-km')}
          />
        );

      case 'recommendation':
        return (
          <Recommendation
            kmBand={userData.kmBand}
            vehicleAge={userData.vehicleAge}
            vehicleType={userData.vehicleType}
            finance={userData.finance}
            onNext={(rec) => {
              update({ recommendation: rec && rec.plan ? rec.plan : 'logbook' });
              setStep('signup');
            }}
            onBack={() => setStep('q3-vehicle')}
          />
        );

      case 'signup':
        return (
          <SignupScreen
            onNext={() => setStep('verify')}
            onBack={() => setStep('recommendation')}
            recommendation={userData.recommendation}
          />
        );

      case 'login':
        return (
          <LoginScreen
            onNext={(data) => {
              const action = data?.action;
              if (action === 'forgot') setStep('forgot');
              else if (action === 'pin') setStep('pin');
              else if (action === 'signup') setStep('q1-trade');
              else setStep('setup-vehicle');
            }}
            onBack={() => setStep('splash')}
          />
        );

      case 'verify':
        return (
          <VerifyScreen
            onNext={() => setStep('setup-vehicle')}
            onBack={() => setStep('signup')}
          />
        );

      case 'forgot':
        return (
          <ForgotScreen
            onNext={() => setStep('login')}
            onBack={() => setStep('login')}
          />
        );

      case 'pin':
        return (
          <PinScreen
            onNext={() => setStep('setup-vehicle')}
            onBack={() => setStep('login')}
          />
        );

      case 'setup-vehicle':
        return (
          <SetupVehicleScreen
            onNext={() => setStep('setup-tax')}
            onBack={() => setStep('verify')}
          />
        );

      case 'setup-tax':
        return (
          <SetupTaxScreen
            onNext={() => setStep('tracking')}
            onBack={() => setStep('setup-vehicle')}
            userData={userData}
          />
        );

      case 'tracking':
        return (
          <TrackingMethodScreen
            onNext={() => setStep('plan-select')}
            onBack={() => setStep('setup-tax')}
          />
        );

      case 'plan-select':
        return (
          <PlanSelectScreen
            onNext={() => setStep('mates-rates')}
            onBack={() => setStep('tracking')}
            userData={userData}
          />
        );

      case 'mates-rates':
        return (
          <MatesRatesScreen
            onNext={() => onComplete()}
            onBack={() => setStep('plan-select')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      {renderStep()}
    </div>
  );
}
