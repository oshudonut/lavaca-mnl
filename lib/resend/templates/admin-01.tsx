import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Row,
  Text,
} from '@react-email/components'
import * as React from 'react'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)

export interface Admin01Props {
  order_id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address: string
  delivery_date: string
  delivery_window: string
  items: { name: string; weight_label: string; quantity: number; subtotal: number }[]
  total_amount: number
  payment_method: 'gcash' | 'bank_transfer'
  admin_url: string
}

export default function Admin01({
  order_number,
  customer_name,
  customer_email,
  customer_phone,
  delivery_address,
  delivery_date,
  delivery_window,
  items,
  total_amount,
  payment_method,
  admin_url,
}: Admin01Props) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>
        <Container
          style={{
            maxWidth: '560px',
            margin: '32px auto',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '32px',
          }}
        >
          <Heading style={{ fontSize: '22px', color: '#111' }}>
            New Order — {order_number}
          </Heading>

          <Hr />

          <Heading as="h2" style={{ fontSize: '16px', color: '#333' }}>
            Customer
          </Heading>
          <Text style={{ fontSize: '14px', margin: '0 0 4px' }}>
            <strong>Name:</strong> {customer_name}
          </Text>
          <Text style={{ fontSize: '14px', margin: '0 0 4px' }}>
            <strong>Email:</strong> {customer_email}
          </Text>
          <Text style={{ fontSize: '14px', margin: '0 0 4px' }}>
            <strong>Phone:</strong> {customer_phone}
          </Text>
          <Text style={{ fontSize: '14px', margin: '0 0 4px' }}>
            <strong>Address:</strong> {delivery_address}
          </Text>
          <Text style={{ fontSize: '14px', margin: '0 0 4px' }}>
            <strong>Payment:</strong>{' '}
            {payment_method === 'gcash' ? 'GCash' : 'Bank Transfer'}
          </Text>

          <Hr />

          <Heading as="h2" style={{ fontSize: '16px', color: '#333' }}>
            Delivery
          </Heading>
          <Text style={{ fontSize: '14px', margin: '0 0 4px' }}>
            <strong>Date:</strong> {delivery_date}
          </Text>
          <Text style={{ fontSize: '14px', margin: '0' }}>
            <strong>Window:</strong> {delivery_window}
          </Text>

          <Hr />

          <Heading as="h2" style={{ fontSize: '16px', color: '#333' }}>
            Items
          </Heading>
          {items.map((item, i) => (
            <Row key={i} style={{ marginBottom: '4px' }}>
              <Column>
                <Text style={{ margin: '0', fontSize: '14px' }}>
                  {item.name} · {item.weight_label} × {item.quantity}
                </Text>
              </Column>
              <Column align="right">
                <Text style={{ margin: '0', fontSize: '14px' }}>{fmt(item.subtotal)}</Text>
              </Column>
            </Row>
          ))}
          <Hr />
          <Row>
            <Column>
              <Text style={{ fontWeight: 'bold', margin: '0' }}>Total</Text>
            </Column>
            <Column align="right">
              <Text style={{ fontWeight: 'bold', margin: '0' }}>{fmt(total_amount)}</Text>
            </Column>
          </Row>

          <Hr />

          <Link
            href={admin_url}
            style={{
              display: 'inline-block',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              borderRadius: '6px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              textDecoration: 'none',
            }}
          >
            View Order in Admin
          </Link>

          <Hr />
          <Text style={{ fontSize: '12px', color: '#999' }}>
            Lavaca MNL Admin Notification
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
