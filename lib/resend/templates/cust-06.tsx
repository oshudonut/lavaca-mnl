import { Body, Container, Head, Heading, Hr, Html, Link, Text } from '@react-email/components'
import * as React from 'react'
import { siteUrl } from '@/lib/site'

export interface Cust06Props {
  order_number: string
  customer_name: string
}

export default function Cust06({ order_number, customer_name }: Cust06Props) {
  return (
    <Html><Head />
      <Body style={{ backgroundColor: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '32px auto', backgroundColor: '#fff', borderRadius: '8px', padding: '32px' }}>
          <Heading style={{ fontSize: '22px', color: '#111' }}>Your order has expired</Heading>
          <Text style={{ color: '#555', marginTop: '0' }}>
            Hi {customer_name}, your order <strong>{order_number}</strong> has expired because a payment screenshot was not uploaded within 2 hours.
          </Text>
          <Hr />
          <Text style={{ fontSize: '14px', color: '#333' }}>
            Your pickup time has been released. If you would still like to order, you are welcome to place a new order at any time.
          </Text>
          <Text style={{ fontSize: '14px' }}>
            <Link href={`${siteUrl()}/order`} style={{ color: '#16a34a' }}>
              Place a new order
            </Link>
          </Text>
          <Hr />
          <Text style={{ fontSize: '12px', color: '#999' }}>Lavaca MNL · Thank you for your interest.</Text>
        </Container>
      </Body>
    </Html>
  )
}
