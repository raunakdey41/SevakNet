/**
 * West Bengal District Center Coordinates
 * Used to center the map on the NGO's specific district.
 */
export const districtCenters = {
  'Alipurduar': [26.4919, 89.5271],
  'Bankura': [23.1548, 87.1952],
  'Birbhum': [23.9212, 87.6729],
  'Cooch Behar': [26.3473, 89.3323],
  'Dakshin Dinajpur': [25.3125, 88.6548],
  'Darjeeling': [26.8833, 88.3132],
  'Hooghly': [22.8327, 88.1654],
  'Howrah': [22.5332, 88.1834],
  'Jalpaiguri': [26.5164, 88.7179],
  'Jhargram': [22.4500, 86.9800],
  'Kalimpong': [27.0660, 88.4692],
  'Kolkata': [22.5283, 88.3666],
  'Malda': [24.9995, 88.1371],
  'Murshidabad': [24.1564, 88.3580],
  'Nadia': [23.1851, 88.4962],
  'North 24 Parganas': [22.8193, 88.7099],
  'Paschim Bardhaman': [23.5834, 87.1414],
  'Paschim Medinipur': [22.3843, 87.2769],
  'Purba Bardhaman': [23.4388, 87.9964],
  'Purba Medinipur': [22.0482, 87.9147],
  'Purulia': [23.4404, 86.5157],
  'South 24 Parganas': [22.1134, 88.1662],
  'Uttar Dinajpur': [25.9417, 88.1568]
};

/**
 * Returns the center coordinates for a given district.
 * Falls back to West Bengal's general center (Kolkata region) if not found.
 */
export const getDistrictCenter = (district) => {
  return districtCenters[district] || [22.5726, 88.3639];
};
