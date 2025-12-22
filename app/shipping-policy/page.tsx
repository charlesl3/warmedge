export default function ShippingPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20 pt-44 text-slate-700">
      <h1 className="text-3xl font-semibold text-slate-900 mb-8">
        Shipping Policy
      </h1>

      <p className="mb-6">
        Orders are shipped using USPS First Class by default. Shipping costs
        are calculated and added at checkout unless otherwise stated.
      </p>

      <p className="mb-6">
        Orders with a total value over <span className="font-medium">$59</span>
        &nbsp;qualify for free standard shipping.
      </p>

      <h2 className="text-lg font-medium text-slate-900 mt-12 mb-4">
        Free destination pickup and delivery
      </h2>

      <p className="mb-6">
        As dedicated skaters ourselves, we offer a courtesy local destination
        delivery option for customers who prefer in-person pickup.
        This option is available at&nbsp;
        <span className="font-medium">
          Montclair State University Ice Arena, 1 Arena Dr, Little Falls Township, NJ 07424
        </span>.
      </p>

      <p className="mb-6">
        Pickup is available every&nbsp;
        <span className="font-medium">Tuesday and Thursday</span>, between
        <span className="font-medium"> 12:30 PM and 2:30 PM</span>.
        Selecting this option provides free delivery to the pickup location.
      </p>

      <p className="mb-6">
        If this delivery method is selected but the pickup window is missed,
        please contact us by email so we can discuss alternative arrangements.
      </p>

      <p className="mb-6">
        Cash payment at pickup is welcome for destination delivery orders.
        Depending on availability, items may be delivered as soon as the
        next business day.
      </p>

      <h2 className="text-lg font-medium text-slate-900 mt-12 mb-4">
        Questions
      </h2>

      <p>
        If you have any questions regarding shipping or pickup options,
        please contact us at&nbsp;
        <a
          href="mailto:charlesatlife@gmail.com"
          className="underline underline-offset-4 hover:text-slate-900"
        >
          charlesatlife@gmail.com
        </a>.
      </p>
    </main>
  )
}
