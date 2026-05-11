package com.example.tripplanner

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.google.android.material.appbar.MaterialToolbar

class StatisticsActivity : AppCompatActivity() {

    private lateinit var viewModel: TripViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_statistics)

        val toolbar = findViewById<MaterialToolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        toolbar.setNavigationOnClickListener { finish() }

        val tvTotalTrips = findViewById<TextView>(R.id.tvTotalTrips)
        val tvTotalBudget = findViewById<TextView>(R.id.tvTotalBudget)
        val tvAvgBudget = findViewById<TextView>(R.id.tvAvgBudget)
        val tvMostExpensive = findViewById<TextView>(R.id.tvMostExpensive)
        val tvLatestTrip = findViewById<TextView>(R.id.tvLatestTrip)

        viewModel = ViewModelProvider(this)[TripViewModel::class.java]

        viewModel.allTrips.observe(this) { trips ->
            val count = trips.size
            val totalBudget = trips.sumOf { it.budget }
            val avgBudget = if (count > 0) totalBudget / count else 0.0
            val mostExpensive = trips.maxByOrNull { it.budget }
            val latest = trips.firstOrNull()

            tvTotalTrips.text = count.toString()
            tvTotalBudget.text = "$%.2f".format(totalBudget)
            tvAvgBudget.text = "$%.2f".format(avgBudget)
            tvMostExpensive.text = mostExpensive?.let {
                "${it.title} — ${it.destination} ($%.2f)".format(it.budget)
            } ?: getString(R.string.no_data)
            tvLatestTrip.text = latest?.let {
                "${it.title} — ${it.startDate}"
            } ?: getString(R.string.no_data)
        }
    }
}
