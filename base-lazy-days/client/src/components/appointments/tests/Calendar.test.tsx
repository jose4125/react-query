import { screen } from '@testing-library/react';
import { mockUser } from 'mocks/mockData';
import { rest } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { renderWithQueryClient } from 'test-utils';

import { server } from '../../../mocks/server';
// import { defaultQueryClientOptions } from '../../../react-query/queryClient';
import { Calendar } from '../Calendar';

// mocking useUser to mimic a logged-in user
jest.mock('../../user/hooks/useUser', () => ({
  __esModule: true,
  useUser: () => ({ user: mockUser }),
}));

test('Reserve appointment error', async () => {
  // (re)set handler to return a 500 error for appointments
  server.resetHandlers(
    rest.get(
      'http://localhost:3030/appointments/:month/:year',
      (req, res, ctx) => {
        return res(ctx.status(500));
      },
    ),
  );

  renderWithQueryClient(
    <MemoryRouter>
      <Calendar />
    </MemoryRouter>,
  );

  // check for the toast
  const alertToast = await screen.findByRole('alert');

  expect(alertToast).toHaveTextContent('Request failed with status code 500');
});
