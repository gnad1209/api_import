var objectReturn = {
  status: 1,  
  msg: 'OK', 
  data: null, 
};

const test = async (req, res, next) => {
  return res.status(200).json({
    ...objectReturn,
    status: 1,
    msg: 'OK',
    data: null,
  });
};

module.exports = {
  test,
};
