import { version } from '../package.json'

// ?? 🤔 ?? --> https://en.freesewing.dev/packages/core/config

export default {
  name: 'penelope',
  version,
  beta: true,
  design: 'Wouter Van Wageningen',
  code: 'Wouter Van Wageningen',
  department: 'womenswear',
  type: 'pattern',
  difficulty: 3,
  tags: ['skirt', 'bottom', 'basics'],
  optionGroups: {
    fit: [
      'lengthBonus',
      'hem',
      'backVent',
      'backVentLength',
      'waistBand',
      'waistBandWidth',
      'zipperLocation',
      'nrOfDarts',
      'hemBonus'
    ],
    advanced: [
      'seatEase',
      'waistEase',
      'backDartDepthFactor',
      'frontDartDepthFactor',
      'dartToSideSeamFactor'
    ]
  },
  measurements: [
    'naturalWaist',
    'seatCircumference',
    'naturalWaistToHip',
    'naturalWaistToSeat',
    'naturalWaistToKnee'
  ],
  dependencies: {},
  inject: {},
  hide: [],
  parts: ['front', 'back', 'waistband'],
  options: {
    dartMaximumDifference: 300,
    dartMinimumDifference: 180,
    dartMinimumWidth: 6,
    dartSideMinimum: 10,
    dartBackControl1: 100,
    dartBackControl2: 5,
    dartBackControl3: 4,
    curvePlacement: 2.4,
    dart2offset: 32,
    dart2factor: 0.8,
    hipCurveDividerDown: 40,
    hipCurveDividerUp: 3,
    sideSeamShiftPercentage: 0.006,
    backVentWidth: 50,
    paperlessOffset: 15,
    waistBandOverlap: 25,
    lengthBonus: { pct: 0, min: -50, max: 50 },
    hemBonus: { pct: 0, min: -35, max: 0 },
    hem: { mm: 25, min: 0, max: 75 },
    backVent: { bool: true },
    backVentLength: { pct: 40, min: 5, max: 70 },
    waistBand: { bool: true },
    waistBandWidth: { mm: 50, min: 10, max: 200 },
    zipperLocation: { dflt: 'backSeam', list: ['backSeam', 'sideSeam'] },
    nrOfDarts: { count: 2, min: 1, max: 2 },

    seatEase: { mm: 5, min: 0, max: 15 },
    waistEase: { mm: 5, min: 0, max: 15 },
    backDartDepthFactor: { pct: 50, min: 35, max: 70 },
    frontDartDepthFactor: { pct: 45, min: 30, max: 65 },
    dartToSideSeamFactor: { pct: 50, min: 30, max: 70 }
  }
}
