// updateData
/*eslint-disable*/

import axios from 'axios';
import { showAlert } from './alerts';
const User = require('../../models/userModel');

export const updateSettings = async (data, type) => {
  //type is either 'password' or 'data'
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword'
        : 'http://127.0.0.1:3000/api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} Updated Successfully.`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};