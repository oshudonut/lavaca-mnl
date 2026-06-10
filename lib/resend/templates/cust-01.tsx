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

export interface Cust01Props {
  order_number: string
  customer_name: string
  delivery_date: string
  delivery_window: string
  items: { name: string; weight_label: string; quantity: number; subtotal: number }[]
  total_amount: number
  payment_url: string
  payment_method: 'gcash' | 'bank_transfer'
}

export default function Cust01({
  order_number,
  customer_name,
  delivery_date,
  delivery_window,
  items,
  total_amount,
  payment_url,
  payment_method,
}: Cust01Props) {
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
          <Heading style={{ fontSize: '22px', color: '#111', marginBottom: '4px' }}>
            We received your order!
          </Heading>
          <Text style={{ color: '#555', marginTop: '0' }}>
            Hi {customer_name}, your order <strong>{order_number}</strong> has been placed.
          </Text>

          <Hr />

          <Heading as="h2" style={{ fontSize: '16px', color: '#333' }}>
            Order Summary
          </Heading>
          {items.map((item, i) => (
            <Row key={i} style={{ marginBottom: '6px' }}>
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

          <Text style={{ fontSize: '14px', color: '#333' }}>
            <strong>Delivery date:</strong> {delivery_date}
            <br />
            <strong>Time window:</strong> {delivery_window}
          </Text>

          <Hr />

          <Heading as="h2" style={{ fontSize: '16px', color: '#333' }}>
            Next step: Send your payment
          </Heading>
          <Text style={{ fontSize: '14px', color: '#555' }}>
            Please send your payment via{' '}
            {payment_method === 'gcash' ? 'GCash' : 'bank transfer'} and upload a screenshot
            to confirm your order.{' '}
            <strong>You have 2 hours</strong> to upload your screenshot, or your order will
            expire.
          </Text>
          <Link
            href={payment_url}
            style={{
              display: 'inline-block',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: '6px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              textDecoration: 'none',
              marginTop: '8px',
            }}
          >
            Upload Payment Screenshot
          </Link>

          <Hr />
          <Text style={{ fontSize: '12px', color: '#999' }}>
            Lavaca MNL · For questions, message us on Facebook Messenger.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
