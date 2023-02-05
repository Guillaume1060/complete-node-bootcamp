/* eslint-disable */
// Tous les données, functions de mapBox ne sont pas installées
import '@babel/polyfill';
// import { logout } from '../../controllers/authController.js';
import { login, logout } from './login.js';
import { updateSettings } from './updateSettings.js';

// DOM ELEMENTS
const loginForm = document.querySelector('.form--login');
const logOutButton = document.querySelector('.nav__el--logout');
const updateButton = document.querySelector('.form-user-data');
const updatePassword = document.querySelector('.form-user-password');

// DELEGATION
if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    e.preventDefault();
    login(email, password);
  });

if (logOutButton) logOutButton.addEventListener('click', logout);

if (updateButton)
  updateButton.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateSettings(form, 'data');
  });

if (updatePassword)
  updatePassword.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );
    document.querySelector('.btn--save-password').textContent = 'Save Password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
