import { useParams, Navigate } from 'react-router-dom';
import IncomeTaxCalc from './calculators/IncomeTaxCalc';
import VacationPayCalc from './calculators/VacationPayCalc';
import TaxPenaltyCalc from './calculators/TaxPenaltyCalc';
import VatCalc from './calculators/VatCalc';
import WorkExperienceCalc from './calculators/WorkExperienceCalc';
import AlimonyCalc from './calculators/AlimonyCalc';
import SickLeaveCalc from './calculators/SickLeaveCalc';
import BusinessTripCalc from './calculators/BusinessTripCalc';
import RentCalc from './calculators/RentCalc';

const calcMap: Record<string, React.ComponentType> = {
  'income-tax': IncomeTaxCalc,
  'vacation-pay': VacationPayCalc,
  'tax-penalty': TaxPenaltyCalc,
  'vat': VatCalc,
  'work-experience': WorkExperienceCalc,
  'alimony': AlimonyCalc,
  'sick-leave': SickLeaveCalc,
  'business-trip': BusinessTripCalc,
  'rent': RentCalc,
};

export default function CalculatorRouter() {
  const { slug } = useParams<{ slug: string }>();
  const Comp = slug ? calcMap[slug] : null;
  if (!Comp) return <Navigate to="/app/calculator" replace />;
  return <Comp />;
}
