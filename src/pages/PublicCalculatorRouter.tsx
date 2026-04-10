import { useParams, Navigate } from 'react-router-dom';
import IncomeTaxCalc from './calculators/IncomeTaxCalc';
import VatCalc from './calculators/VatCalc';
import AlimonyCalc from './calculators/AlimonyCalc';
import SickLeaveCalc from './calculators/SickLeaveCalc';
import BusinessTripCalc from './calculators/BusinessTripCalc';
import RentCalc from './calculators/RentCalc';
import StatuteOfLimitationsCalc from './calculators/StatuteOfLimitationsCalc';
import VacationPayCalc from './calculators/VacationPayCalc';
import TaxPenaltyCalc from './calculators/TaxPenaltyCalc';
import WorkExperienceCalc from './calculators/WorkExperienceCalc';

const calcMap: Record<string, React.ComponentType> = {
  'income-tax': IncomeTaxCalc,
  'nds': VatCalc,
  'alimony': AlimonyCalc,
  'sick-leave': SickLeaveCalc,
  'business-trip': BusinessTripCalc,
  'rent': RentCalc,
  'statute-of-limitations': StatuteOfLimitationsCalc,
  'vacation-pay': VacationPayCalc,
  'tax-penalty': TaxPenaltyCalc,
  'work-experience': WorkExperienceCalc,
};

export default function PublicCalculatorRouter() {
  const { slug } = useParams<{ slug: string }>();
  const Comp = slug ? calcMap[slug] : null;
  if (!Comp) return <Navigate to="/calculator" replace />;
  return (
    <div className="container max-w-5xl mx-auto px-4 py-10">
      <Comp />
    </div>
  );
}
