export const MOCK_PRODUCTS = [
  {
    id: '1',
    name: 'Ultra Strength Omega-3 Fish Oil Supplement',
    brand: 'NaturePlus',
    imageUrl: 'https://images.pexels.com/photos/6941883/pexels-photo-6941883.jpeg',
    score: 85,
    date: '2 days ago',
  },
  {
    id: '2',
    name: 'Complete Multivitamin Daily Formula',
    brand: 'VitaCore',
    imageUrl: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg',
    score: 73,
    date: '3 days ago',
  },
  {
    id: '3',
    name: 'Vitamin D3 5000 IU Immune Support',
    brand: 'PureNutrients',
    imageUrl: 'https://images.pexels.com/photos/6692132/pexels-photo-6692132.jpeg',
    score: 92,
    date: '1 week ago',
  },
  {
    id: '4',
    name: 'Magnesium Glycinate Complex',
    brand: 'OptimumHealth',
    imageUrl: 'https://images.pexels.com/photos/5856020/pexels-photo-5856020.jpeg',
    score: 45,
    date: '2 weeks ago',
  },
  {
    id: '5',
    name: 'Probiotic 50 Billion CFU Formula',
    brand: 'GutBalance',
    imageUrl: 'https://images.pexels.com/photos/5699514/pexels-photo-5699514.jpeg',
    score: 67,
    date: '3 weeks ago',
  },
];

export const MOCK_COMPARISONS = [
  {
    id: '1',
    product1: {
      name: 'Ultra Strength Omega-3 Fish Oil Supplement',
      brand: 'NaturePlus',
      imageUrl: 'https://images.pexels.com/photos/6941883/pexels-photo-6941883.jpeg',
      score: 85,
    },
    product2: {
      name: 'Pure Omega-3 Wild Caught Fish Oil',
      brand: 'OceanHealth',
      imageUrl: 'https://images.pexels.com/photos/6692103/pexels-photo-6692103.jpeg',
      score: 92,
    },
  },
  {
    id: '2',
    product1: {
      name: 'Complete Multivitamin Daily Formula',
      brand: 'VitaCore',
      imageUrl: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg',
      score: 73,
    },
    product2: {
      name: 'Premium Multivitamin & Mineral Complex',
      brand: 'OptimumHealth',
      imageUrl: 'https://images.pexels.com/photos/5699514/pexels-photo-5699514.jpeg',
      score: 67,
    },
  },
];

export const MOCK_PRODUCT_DETAILS = {
  id: '123',
  name: 'Ultra Strength Omega-3 Fish Oil Supplement',
  brand: 'NaturePlus',
  imageUrl: 'https://images.pexels.com/photos/6941883/pexels-photo-6941883.jpeg',
  overallScore: 85,
  overallSummary: 'This supplement provides a high-quality fish oil with appropriate EPA and DHA levels. Transparent about sourcing and testing for contaminants. Dosage is evidence-based and matches label claims.',
  categories: [
    {
      name: 'Ingredient Quality',
      score: 90,
      insights: [
        'Contains pharmaceutical-grade fish oil from wild-caught sources',
        'Includes natural lemon flavor to reduce fishy aftertaste',
        'Free from artificial colors, flavors, and preservatives'
      ]
    },
    {
      name: 'Label Transparency',
      score: 85,
      insights: [
        'Clearly lists EPA and DHA content per serving',
        'Provides specific fish sources (anchovy, sardine, mackerel)',
        'Discloses extraction method (molecular distillation)'
      ]
    },
    {
      name: 'Dosage Accuracy',
      score: 95,
      insights: [
        'Third-party tested to verify EPA/DHA content matches label',
        'Recommended serving size aligns with research-backed amounts',
        'Consistent potency throughout shelf life'
      ]
    },
    {
      name: 'Value Assessment',
      score: 70,
      insights: [
        'Higher price point but justified by quality and potency',
        'Cost per serving is moderate compared to similar products',
        'Fewer servings per bottle than some competitors'
      ]
    }
  ]
};