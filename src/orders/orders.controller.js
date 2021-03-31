const { stat } = require("fs");
const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
//Vaildation Middleware

// checks if id === :orderId
function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder
        return next();
    }
    next({
        status: 404,
        message: `Order does not exist: ${orderId}.`,
      });
}

//id in the body does not match :orderId in the route
//status property is missing/empty/invalid or is "delivered"
function checkOrderStatus(req, res, next) {
    const orderId = req.params.orderId;
    const { data: { id, status } } = req.body
    const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"]
    
    if (
      id !== orderId &&
      id !== null &&
      id !== undefined &&
      id !== ""
      ) {
        next({
            status: 400,
            message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
        });
    } else if (!status || status === "") {
        next({
            status: 400,
            message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
        });   
    } else if (status === "delivered") {
        next({
            status: 400,
            message: `A delivered order cannot be changed`,
        });
    } else if (!validStatuses.includes(status)) {
        next({
            status: 400,
            message: `status ${status} is invalid`,
          });
    }
    return next();
}
  
// checks if order status is pending before deleting order
function isPending(req, res, next) {
    const order = res.locals.order
    
    if (order.status !== "pending") {
        next({
            status: 400,
            message: `An order cannot be deleted unless it is pending`,
        });
    }
    return next();
}

// checks the BODY to ensure every key and value is valid
function bodyIsValid(req, res, next) {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  
    if (!deliverTo || deliverTo === "") {
        next({
            status: 400,
            message: "Order must include a deliverTo",
        });
    } else if (!mobileNumber || mobileNumber === "") {
        next({
            status: 400,
            message: "Order must include a mobileNumber",
        });
    } else if (!dishes) {
        next({
            status: 400,
            message: "Order must include a dish",
        });
    } else if (dishes.length === 0 || !(Array.isArray(dishes))) {
      next({
        status: 400,
        message: "Order must include at least one dish",
      });
    } else if (dishes) {
        dishes.forEach((dish, index) => {
           const quantity = dish.quantity
            if (!quantity || quantity <= 0 || typeof quantity !== "number") {
                next({
                    status: 400,
                    message: `Dish ${index} must have a quantity that is an integer greater than 0`,
                  }); 
           }
      })
    }
    next();
}
  
//middleware requests

// GET for /orders (list)
function list(req, res) {
    res.status(200).json({ data: orders })
}

// POST for /orders (create)
function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes,
    }
    orders.push(newOrder);

    res.status(201).json({data: newOrder})
}

//GET for /orders/:orderId (read)
function read(req, res) {
    const order = res.locals.order;
    res.json({data: order})
}

//PUT for /orders/:orderId (update)
function update(req, res) {
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    if (order.deliverTo !== deliverTo) {
        order.deliverTo = deliverTo
    }
    if (order.mobileNumber !== mobileNumber) {
      order.mobileNumber = mobileNumber
    }
    if (order.status !== status) {
        order.status = status
    }
    if (order.dishes !== dishes) {
        order.dishes.forEach(origDish => {
            dishes.forEach(newDish => {
                origDish.id = newDish.id;
                origDish.description = newDish.description;
                origDish.img_url = newDish.img_url;
                origDish.price = newDish.price;
                origDish.quantity = newDish.quantity;
          })
      })
    }
  
  res.json( {data: order})
  
}

//DELETE for /orders/:orderId
  function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    // splice returns an array of the deleted elements, even if it is one element
    orders.splice(index, 1);

    res.sendStatus(204);
}

module.exports = {
    create: [bodyIsValid, create],
    list,
    read: [orderExists, read],
    update: [orderExists, bodyIsValid, checkOrderStatus, update],
    delete: [orderExists, isPending, destroy],
};