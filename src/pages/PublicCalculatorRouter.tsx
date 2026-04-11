import { useParams, Navigate } from 'react-router-dom';
import { PageSEO } from '@/components/shared/PageSEO';
import { allCalculators } from '@/lib/calculatorsList';
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

  const calc = allCalculators.find(c => c.slug === slug);
  const calcTitle = calc?.title || 'Калькулятор';
  const calcDesc = calc?.description || '';

  const webAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${calcTitle} онлайн`,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BYN' },
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-10">
      <PageSEO
        title={`${calcTitle} онлайн | Бабиджон`}
        description={`${calcDesc}. Актуальные ставки 2026.`}
        path={`/calculator/${slug}`}
        jsonLd={[webAppJsonLd]}
        breadcrumbs={[
          { name: 'Главная', path: '/' },
          { name: 'Калькуляторы', path: '/calculator' },
          { name: calcTitle, path: `/calculator/${slug}` },
        ]}
      />
      <Comp />
    </div>
  );
}
