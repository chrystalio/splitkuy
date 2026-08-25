// components/PeopleSection.test.tsx
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { PeopleSection } from './PeopleSection';
import { renderWithBill } from '@/test-utils/render-with-bill';

describe('PeopleSection — empty state', () => {
  it('shows the empty hint when no people exist', async () => {
    renderWithBill(<PeopleSection />);
    await waitFor(() => {
      expect(screen.getByText(/No people yet/i)).toBeInTheDocument();
    });
  });

  it('does not show the host-hint text when no people exist', async () => {
    renderWithBill(<PeopleSection />);
    await waitFor(() => {
      expect(screen.getByText(/No people yet/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/tap a name to set as host/i)).toBeNull();
  });
});

describe('PeopleSection — adding people', () => {
  it('adds a person when the input is filled and Add is clicked', async () => {
    const { user } = renderWithBill(<PeopleSection />);
    await waitFor(() => {
      expect(screen.getByText(/No people yet/i)).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText(/add person name/i), 'Andi');
    await user.click(screen.getByRole('button', { name: /^Add$/ }));
    await waitFor(() => {
      expect(screen.getByText('Andi')).toBeInTheDocument();
    });
  });

  it('adds a person when Enter is pressed in the input', async () => {
    const { user } = renderWithBill(<PeopleSection />);
    await waitFor(() => {
      expect(screen.getByText(/No people yet/i)).toBeInTheDocument();
    });
    const input = screen.getByPlaceholderText(/add person name/i);
    await user.type(input, 'Budi{enter}');
    await waitFor(() => {
      expect(screen.getByText('Budi')).toBeInTheDocument();
    });
  });

  it('trims whitespace from names', async () => {
    const { user } = renderWithBill(<PeopleSection />);
    await waitFor(() => {
      expect(screen.getByText(/No people yet/i)).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText(/add person name/i), '  Citra  ');
    await user.click(screen.getByRole('button', { name: /^Add$/ }));
    await waitFor(() => {
      expect(screen.getByText('Citra')).toBeInTheDocument();
    });
  });

  it('rejects empty or whitespace-only names', async () => {
    renderWithBill(<PeopleSection />);
    await waitFor(() => {
      expect(screen.getByText(/No people yet/i)).toBeInTheDocument();
    });
    const addButton = screen.getByRole('button', { name: /^Add$/ });
    expect(addButton).toBeDisabled();
  });

  it('rejects duplicate names (case-insensitive)', async () => {
    const { user } = renderWithBill(<PeopleSection />);
    await waitFor(() => {
      expect(screen.getByText(/No people yet/i)).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText(/add person name/i), 'Andi');
    await user.click(screen.getByRole('button', { name: /^Add$/ }));
    await waitFor(() => {
      expect(screen.getByText('Andi')).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText(/add person name/i), 'andi');
    await user.click(screen.getByRole('button', { name: /^Add$/ }));
    await waitFor(() => {
      expect(screen.getByText(/already added/i)).toBeInTheDocument();
    });
  });

  it('clears the input after a successful add', async () => {
    const { user } = renderWithBill(<PeopleSection />);
    await waitFor(() => {
      expect(screen.getByText(/No people yet/i)).toBeInTheDocument();
    });
    const input = screen.getByPlaceholderText(/add person name/i);
    await user.type(input, 'Andi');
    await user.click(screen.getByRole('button', { name: /^Add$/ }));
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });
});

describe('PeopleSection — host designation', () => {
  it('first person added is the host automatically', async () => {
    const { user } = renderWithBill(<PeopleSection />);
    await waitFor(() => {
      expect(screen.getByText(/No people yet/i)).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText(/add person name/i), 'Andi');
    await user.click(screen.getByRole('button', { name: /^Add$/ }));
    await waitFor(() => {
      // The host dot (rendered as a green circle) is aria-labelled "host".
      expect(screen.getByLabelText('host')).toBeInTheDocument();
    });
  });

  it('clicking a non-host name promotes them to host', async () => {
    const { user } = renderWithBill(<PeopleSection />);
    await waitFor(() => {
      expect(screen.getByText(/No people yet/i)).toBeInTheDocument();
    });
    // Add two people — first is host, second isn't.
    await user.type(screen.getByPlaceholderText(/add person name/i), 'Andi');
    await user.click(screen.getByRole('button', { name: /^Add$/ }));
    await user.type(screen.getByPlaceholderText(/add person name/i), 'Budi');
    await user.click(screen.getByRole('button', { name: /^Add$/ }));
    await waitFor(() => {
      expect(screen.getByLabelText('host')).toBeInTheDocument();
    });
    expect(screen.getAllByLabelText('host')).toHaveLength(1);
    // Click Budi's name → he becomes host.
    await user.click(screen.getByRole('button', { name: /Set Budi as host/i }));
    // Now only Budi has the host marker.
    const hostLabels = screen.getAllByLabelText('host');
    expect(hostLabels).toHaveLength(1);
    // The host-marker button is on Budi's chip.
    expect(hostLabels[0]).toBeInTheDocument();
  });

  it('shows the hint text once at least one person exists', async () => {
    const { user } = renderWithBill(<PeopleSection />);
    await waitFor(() => {
      expect(screen.getByText(/No people yet/i)).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText(/add person name/i), 'Andi');
    await user.click(screen.getByRole('button', { name: /^Add$/ }));
    await waitFor(() => {
      expect(screen.getByText(/tap a name to set as host/i)).toBeInTheDocument();
    });
  });
});

describe('PeopleSection — removing people', () => {
  it('removes a person when the × button is clicked', async () => {
    const { user } = renderWithBill(<PeopleSection />);
    await waitFor(() => {
      expect(screen.getByText(/No people yet/i)).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText(/add person name/i), 'Andi');
    await user.click(screen.getByRole('button', { name: /^Add$/ }));
    await waitFor(() => {
      expect(screen.getByText('Andi')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Remove Andi/i }));
    await waitFor(() => {
      expect(screen.queryByText('Andi')).toBeNull();
      expect(screen.getByText(/No people yet/i)).toBeInTheDocument();
    });
  });

  it('promotes the first remaining person to host when host is removed', async () => {
    const { user } = renderWithBill(<PeopleSection />);
    await waitFor(() => {
      expect(screen.getByText(/No people yet/i)).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText(/add person name/i), 'Andi');
    await user.click(screen.getByRole('button', { name: /^Add$/ }));
    await user.type(screen.getByPlaceholderText(/add person name/i), 'Budi');
    await user.click(screen.getByRole('button', { name: /^Add$/ }));
    await waitFor(() => {
      expect(screen.getByText('Budi')).toBeInTheDocument();
    });
    // Andi (host) is removed → Budi should become host.
    await user.click(screen.getByRole('button', { name: /Remove Andi/i }));
    await waitFor(() => {
      expect(screen.getAllByLabelText('host')).toHaveLength(1);
    });
  });
});
