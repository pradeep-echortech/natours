/*eslint-disable*/

// const axios = require('axios')

const login = async (email, password) => {
  try {
    const res = await fetch('http://localhost:5000/api/v1/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    const apiResponse = await res.json();
    if (apiResponse.status === 'success') {
      alert('Logged in Successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    } else {
      throw new Error('invalid credentials');
    }
  } catch (error) {
    console.log(error);
    alert(error);
  }
};

const logout = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/v1/users/logout');
    const apiResponse = await res.json();
    if (apiResponse.status === 'success') location.reload(true);
  } catch (error) {
    alert('Error logging out! Try again');
  }
};

// // type is either data or password  
// const updateSettings = async (data, type) => {
//   try {
//     const url =
//       type === 'password'
//         ? 'http://localhost:5000/api/v1/users/updateMyPassword'
//         : 'http://localhost:5000/api/v1/users/updateMe';
//     const res = await fetch(url, {
//       method: 'PATCH',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body:
//         data
//       }),
//     });
//     const apiResponse = await res.json();
//     if (apiResponse.status === 'success') {
//       alert(`${type.toUpperCase()} Updated Successfully!`);
//     }
//   } catch (error) {
//     alert(error.response.data.message);
//   }
// };
const updateData = async (form)=>{
  try {
    const res =  await fetch('http://localhost:5000/api/v1/users/updateMe',{
      method: 'PATCH',
      body: form
    });
    const apiResponse = await res.json()
    if(apiResponse.status === 'success'){
      alert('Data Updated Successfully!')
    }

  } catch (error) {
    alert(error.response.data.message)
  }
}
const updatePassword = async (passwordCurrent,password,passwordConfirm)=>{
  try {
    const res =  await fetch('http://localhost:5000/api/v1/users/updatePassword',{
      method: 'PATCH',
      headers: {
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        passwordCurrent,
        password,
        passwordConfirm
      }),
    });
    const apiResponse = await res.json()
    if(apiResponse.status === 'success'){
      alert('Password Updated Successfully!')
    }
  } catch (error) {
    alert(error.response.data.message)
  }
}





//
// implementing

const loginForm = document.getElementById('login');
if (loginForm) {
  loginForm.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

const logOutBtn = document.querySelector('.nav__el--logout');
if (logOutBtn) logOutBtn.addEventListener('click', logout);

const userDataForm = document.querySelector('.form-user-data');
if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData()
    form.append('name',document.getElementById('name').value)
    form.append('email',document.getElementById('email').value)
    form.append('photo',document.getElementById('photo').files[0])
    updateData(form);    
  });
}

const userPasswordForm = document.querySelector('.form-user-password')
if(userPasswordForm){
  userPasswordForm.addEventListener('submit',async e =>{
    e.preventDefault();
    document.querySelector('.btn--save--password').textContent = 'Updating...'
    
    const passwordCurrent = document.getElementById('password-current').value;
    const password= document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updatePassword(passwordCurrent,password,passwordConfirm);
    
    document.querySelector('.btn--save--password').textContent = 'Save password'
    document.getElementById('password-current').value = ''
    document.getElementById('password').value = ''
    document.getElementById('password-confirm').value = ''
  })
}

