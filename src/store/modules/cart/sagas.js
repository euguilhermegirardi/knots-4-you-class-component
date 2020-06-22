import { call, select, put, all, takeLatest } from 'redux-saga/effects';
import { toast } from 'react-toastify';

import api from '../../../services/api';
import { addToCartSuccess, updateAmountSuccess } from './actions';
import { formatPrice } from '../../../utils/format';

// function* = 'generator' = async / yield = await.
function* addToCart({ id }) {

  // To not duplicate the product when the user select more than one in 'Home/index.js'.
  // It will sum inside of the cart.
  const productExists = yield select(
    state => state.cart.find(p => p.id === id),
  );

  // call = to get the info from api.
  const stock = yield call(api.get, `/stock/${id}`);
  // console.log(stock);

  const stockAmount = stock.data.amount;
  // console.log(stockAmount);

   // If 'productExists' is not null, use 'productExists.amount' otherwise, use '0'.
  const currentAmount = productExists ? productExists.amount : 0;

  const amount = currentAmount + 1;

  if (amount > stockAmount) {
    toast.error('Out of stock!')
    return;
  }

  // To increment the quantity inside of the 'cart'.
  if (productExists) {

    yield put(updateAmountSuccess(id, amount))

  } else {
    const response = yield call(api.get, `/products/${id}`);

    const data = {
      ...response.data,
      amount: 1,
      priceFormatted: formatPrice(response.data.price),
    }
    // console.log(data);

    // put = to trigger an action.
    yield put(addToCartSuccess(data));
  }

};

function* updateAmount({ id, amount }) {
  if (amount <= 0) return;

  const stock = yield call(api.get, `stock/${id}`);

  const stockAmount = stock.data.amount;

  if (amount > stockAmount) {
    toast.error('Out of stock!')
    return;
  }

  yield put(updateAmountSuccess(id, amount));
}

export default function* watchAll() {
  // all = to register many listeners.
  yield all([
    // takeLatest = To control when the user clicks too fast in the button.
    // ..it will register only one click.
    // 'action from REDUX, SAGA wants to listen '@cart/ADD_REQUEST' and SAGA needs to trigger = addToCart.
    takeLatest('ADD_REQUEST', addToCart),
    takeLatest('UPDATE_AMOUNT_REQUEST', updateAmount)
  ]);
}
