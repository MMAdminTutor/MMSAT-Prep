module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  return res.status(200).json({
    status: 'OK',
    message: 'SAT Practice API is running',
    timestamp: new Date().toISOString()
  });
};
