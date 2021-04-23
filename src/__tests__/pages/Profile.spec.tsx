import React from 'react';
import { render, fireEvent, wait } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';

import Profile from '../../pages/Profile';
import api from '../../services/api';

const mockedHistoryPush = jest.fn();
const mockedUpdateUser = jest.fn();
const mockedAddToast = jest.fn();

jest.mock('react-router-dom', () => {
  return {
    useHistory: () => ({
      push: mockedHistoryPush,
    }),
    Link: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock('../../hooks/toast', () => {
  return {
    useToast: () => ({
      addToast: mockedAddToast,
    }),
  };
});

jest.mock('../../hooks/auth', () => {
  return {
    useAuth: () => ({
      updateUser: mockedUpdateUser,
      user: {
        name: 'John Tre',
        email: 'johntre@example.com',
      },
    }),
  };
});

const apiMock = new MockAdapter(api);

describe('Profile Page', () => {
  beforeEach(() => {
    mockedHistoryPush.mockClear();
    mockedAddToast.mockClear();
    mockedUpdateUser.mockClear();
  });

  it('deve ser capaz de atualizar o nome e e-mail do usuário', async () => {
    const { getByPlaceholderText, getByText } = render(<Profile />);

    const userUpdate = {
      name: 'John Doe',
      email: 'johndoe@example.com',
    };

    apiMock.onPut('/profile').replyOnce(200, userUpdate);

    const nameField = getByPlaceholderText('Nome');
    const emailField = getByPlaceholderText('E-mail');
    const buttonElement = getByText('Confirmar mudanças');

    fireEvent.change(nameField, { target: { value: userUpdate.name } });
    fireEvent.change(emailField, { target: { value: userUpdate.email } });

    fireEvent.click(buttonElement);

    await wait(() => {
      expect(mockedHistoryPush).toHaveBeenCalledWith('/dashboard');
      expect(mockedUpdateUser).toHaveBeenCalledWith(userUpdate);
      expect(mockedAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
        }),
      );
    });
  });

  it('deve ser capaz de atualizar todos os dados do usuário', async () => {
    const { getByPlaceholderText, getByText } = render(<Profile />);

    const userUpdate = {
      name: 'John Doe',
      email: 'johndoe@example.com',
      old_password: 'old_password',
      password: 'new_password',
    };

    apiMock.onPut('/profile').replyOnce(200, userUpdate);

    const nameField = getByPlaceholderText('Nome');
    const emailField = getByPlaceholderText('E-mail');
    const oldPasswordField = getByPlaceholderText('Senha atual');
    const passwordField = getByPlaceholderText('Nova senha');
    const passwordConfirmationField = getByPlaceholderText('Confirmar senha');

    const buttonElement = getByText('Confirmar mudanças');

    fireEvent.change(nameField, { target: { value: userUpdate.name } });
    fireEvent.change(emailField, { target: { value: userUpdate.email } });
    fireEvent.change(oldPasswordField, {
      target: { value: userUpdate.old_password },
    });
    fireEvent.change(passwordField, { target: { value: userUpdate.password } });
    fireEvent.change(passwordConfirmationField, {
      target: { value: userUpdate.password },
    });

    fireEvent.click(buttonElement);

    await wait(() => {
      expect(mockedHistoryPush).toHaveBeenCalledWith('/dashboard');
      expect(mockedUpdateUser).toHaveBeenCalledWith(userUpdate);
      expect(mockedAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
        }),
      );
    });
  });

  it('não deve ser capaz de atualizar a senha com confirmação errada', async () => {
    const { getByPlaceholderText, getByText } = render(<Profile />);

    const userUpdate = {
      name: 'John Doe',
      email: 'johndoe@example.com',
      old_password: 'old_password',
      password: 'new_password',
    };

    const nameField = getByPlaceholderText('Nome');
    const emailField = getByPlaceholderText('E-mail');
    const oldPasswordField = getByPlaceholderText('Senha atual');
    const passwordField = getByPlaceholderText('Nova senha');
    const passwordConfirmationField = getByPlaceholderText('Confirmar senha');

    const buttonElement = getByText('Confirmar mudanças');

    fireEvent.change(nameField, { target: { value: userUpdate.name } });
    fireEvent.change(emailField, { target: { value: userUpdate.email } });
    fireEvent.change(oldPasswordField, {
      target: { value: userUpdate.old_password },
    });
    fireEvent.change(passwordField, { target: { value: userUpdate.password } });
    fireEvent.change(passwordConfirmationField, {
      target: { value: 'wrong-confirmation' },
    });

    fireEvent.click(buttonElement);

    await wait(() => {
      expect(mockedHistoryPush).not.toHaveBeenCalled();
    });
  });

  it('não deve ser capaz de atualizar com campos inválidos', async () => {
    const { getByPlaceholderText, getByText } = render(<Profile />);

    const userUpdate = {
      name: 'John Doe',
      email: 'invalid-email',
    };

    const nameField = getByPlaceholderText('Nome');
    const emailField = getByPlaceholderText('E-mail');
    const buttonElement = getByText('Confirmar mudanças');

    fireEvent.change(nameField, { target: { value: userUpdate.name } });
    fireEvent.change(emailField, { target: { value: userUpdate.email } });

    fireEvent.click(buttonElement);

    await wait(() => {
      expect(mockedHistoryPush).not.toHaveBeenCalled();
    });
  });

  it('deve ser capaz de mostrar um toast se houver um erro', async () => {
    const { getByPlaceholderText, getByText } = render(<Profile />);

    const userUpdate = {
      name: 'John Doe',
      email: 'johndoe@example.com',
    };

    apiMock.onPut('/profile').replyOnce(400);

    const nameField = getByPlaceholderText('Nome');
    const emailField = getByPlaceholderText('E-mail');
    const buttonElement = getByText('Confirmar mudanças');

    fireEvent.change(nameField, { target: { value: userUpdate.name } });
    fireEvent.change(emailField, { target: { value: userUpdate.email } });

    fireEvent.click(buttonElement);

    await wait(() => {
      expect(mockedHistoryPush).not.toHaveBeenCalled();
      expect(mockedAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
        }),
      );
    });
  });

  it('deve ser capaz de atualizar o avatar', async () => {
    const { getByTestId } = render(<Profile />);

    apiMock.onPatch('/users/avatar').replyOnce(200);

    const inputFile = getByTestId('input-file');

    fireEvent.change(inputFile, { target: { files: ['file-teste'] } });

    await wait(() => {
      expect(mockedUpdateUser).toHaveBeenCalled();
      expect(mockedAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
        }),
      );
    });
  });
});
