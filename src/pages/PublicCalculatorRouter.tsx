import { useParams, Navigate } from 'react-router-dom';
import IncomeTaxCalc from './calculators/IncomeTaxCalc';
import VatCalc from './calculators/VatCalc';
import StatuteOfLimitationsCalc from './calculators/StatuteOfLimitationsCalc';

const calcMap: Record<string, React.ComponentType> = {
  'income-tax': IncomeTaxCalc,
  'nds': VatCalc,
  'statute-of-limitations': StatuteOfLimitationsCalc,
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
