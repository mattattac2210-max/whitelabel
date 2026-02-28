import { useState, useCallback } from 'react';
import { SplashScreen } from './splash';
import { TradeSelectScreen } from './trade-select';
import { KmBandScreen } from './km-band';
import VehicleDetails from './vehicle-details';
import Recommendation from './recommendation';
import { SignupScreen, LoginScreen, VerifyScreen, ForgotScreen, PinScreen } from './auth-screens';
import { SetupVehicleScreen, SetupTaxScreen, TrackingMethodScreen, MotionPermScreen, LocationPermScreen, AllSetScreen, PlanSelectScreen, MatesRatesScreen } from './setup-screens';

const PROF_DEFAULTS: Record<string, { bizPct: number; kmBand: string }> = {
  electrician: { bizPct: 0.82, kmBand: '5kto10k' },
  plumber: { bizPct: 0.85, kmBand: '5kto10k' },
  builder: { bizPct: 0.78, kmBand: '5kto10k' },
  carpenter: { bizPct: 0.78, kmBand: '5kto10k' },
  painter: { bizPct: 0.80, kmBand: '5kto10k' },
  hvac: { bizPct: 0.83, kmBand: '5kto10k' },
  landscaper: { bizPct: 0.75, kmBand: '5kto10k' },
  other: { bizPct: 0.70, kmBand: '2kto5k' },
  'real-estate': { bizPct: 0.65, kmBand: '5kto10k' },
  'sales-rep': { bizPct: 0.72, kmBand: 'over10k' },
  delivery: { bizPct: 0.90, kmBand: 'over10k' },
  healthcare: { bizPct: 0.55, kmBand: '2kto5k' },
  consultant: { bizPct: 0.60, kmBand: '2kto5k' },
  mechanic: { bizPct: 0.70, kmBand: '2kto5k' },
  cleaner: { bizPct: 0.80, kmBand: '5kto10k' },
  photography: { bizPct: 0.55, kmBand: '2kto5k' },
  'aged-care': { bizPct: 0.65, kmBand: '2kto5k' },
  'not-listed': { bizPct: 0.50, kmBand: '2kto5k' },
  'not-tradie': { bizPct: 0.50, kmBand: '2kto5k' },
};

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
  | 'motion-perm'
  | 'location-perm'
  | 'all-set'
  | 'plan-select'
  | 'mates-rates';

interface UserData {
  trade: string;
  kmBand: string;
  vehicleAge: string;
  vehicleType: string;
  finance: string;
  priceBand: string;
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
    priceBand: '',
    recommendation: '',
  });

  const update = useCallback((partial: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...partial }));
  }, []);

  const getDefaultBand = (trade: string) => {
    const prof = PROF_DEFAULTS[trade];
    return prof ? prof.kmBand : undefined;
  };

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
            defaultBand={getDefaultBand(userData.trade)}
          />
        );

      case 'q3-vehicle':
        return (
          <VehicleDetails
            onNext={(data) => {
              update({ vehicleAge: data.vehicleAge, vehicleType: data.vehicleType, finance: data.finance, priceBand: data.priceBand });
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
            priceBand={userData.priceBand}
            trade={userData.trade}
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
            onNext={() => setStep('motion-perm')}
            onBack={() => setStep('setup-tax')}
          />
        );

      case 'motion-perm':
        return (
          <MotionPermScreen
            onNext={() => setStep('location-perm')}
            onBack={() => setStep('tracking')}
          />
        );

      case 'location-perm':
        return (
          <LocationPermScreen
            onNext={() => setStep('all-set')}
            onBack={() => setStep('motion-perm')}
          />
        );

      case 'all-set':
        return (
          <AllSetScreen
            onNext={() => setStep('plan-select')}
            onBack={() => setStep('location-perm')}
          />
        );

      case 'plan-select':
        return (
          <PlanSelectScreen
            onNext={() => setStep('mates-rates')}
            onBack={() => setStep('all-set')}
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
