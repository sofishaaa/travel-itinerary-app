package com.example.tripplanner.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.tripplanner.R
import com.example.tripplanner.data.Trip

class TripAdapter(
    private var trips: List<Trip> = emptyList(),
    private val onItemClick: (Trip) -> Unit
) : RecyclerView.Adapter<TripAdapter.TripViewHolder>() {

    inner class TripViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvTitle: TextView = itemView.findViewById(R.id.tvTitle)
        val tvDestination: TextView = itemView.findViewById(R.id.tvDestination)
        val tvDates: TextView = itemView.findViewById(R.id.tvDates)
        val tvBudget: TextView = itemView.findViewById(R.id.tvBudget)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TripViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_trip, parent, false)
        return TripViewHolder(view)
    }

    override fun onBindViewHolder(holder: TripViewHolder, position: Int) {
        val trip = trips[position]
        holder.tvTitle.text = trip.title
        holder.tvDestination.text = trip.destination
        holder.tvDates.text = "${trip.startDate} - ${trip.endDate}"
        holder.tvBudget.text = "$${trip.budget}"
        holder.itemView.setOnClickListener { onItemClick(trip) }
    }

    override fun getItemCount() = trips.size

    fun updateTrips(newTrips: List<Trip>) {
        trips = newTrips
        notifyDataSetChanged()
    }
}