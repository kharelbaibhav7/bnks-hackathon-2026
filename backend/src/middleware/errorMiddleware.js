const errorMiddleware = (err, req, res, next) => {
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 400;
  res.status(status).json({
    success: false,
    message: err.message || "Something went wrong",
  });
};

export default errorMiddleware;
