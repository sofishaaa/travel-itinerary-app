package com.example.tripplanner

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.google.android.material.appbar.MaterialToolbar

class TripDetailActivity : AppCompatActivity() {

    private lateinit var viewModel: TripViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_trip_detail)

        val toolbar = findViewById<MaterialToolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        toolbar.setNavigationOnClickListener { finish() }

        val tvTitle = findViewById<TextView>(R.id.tvDetailTitle)
        val tvDestination = findViewById<TextView>(R.id.tvDetailDestination)
        val tvDates = findViewById<TextView>(R.id.tvDetailDates)
        val tvBudget = findViewById<TextView>(R.id.tvDetailBudget)
        val tvNotes = findViewById<TextView>(R.id.tvDetailNotes)
        val btnEdit = findViewById<Button>(R.id.btnEdit)
        val btnDelete = findViewById<Button>(R.id.btnDelete)

        viewModel = ViewModelProvider(this)[TripViewModel::class.java]

        val tripId = intent.getIntExtra("TRIP_ID", -1)
        if (tripId == -1) {
            finish()
            return
        }

        viewModel.getTripById(tripId).observe(this) { trip ->
            trip?.let {
                tvTitle.text = it.title
                tvDestination.text = it.destination
                tvDates.text = "${it.startDate} — ${it.endDate}"
                tvBudget.text = "$${it.budget}"
                tvNotes.text = if (it.notes.isEmpty()) getString(R.string.no_notes) else it.notes

                btnEdit.setOnClickListener {
                    val intent = Intent(this, AddTripActivity::class.java)
                    intent.putExtra("TRIP_ID", trip.id)
                    startActivity(intent)
                }

                btnDelete.setOnClickListener {
                    AlertDialog.Builder(this)
                        .setTitle(R.string.delete_trip_title)
                        .setMessage(getString(R.string.delete_trip_confirm, trip.title))
                        .setPositiveButton(R.string.btn_delete_confirm) { _, _ ->
                            viewModel.deleteTrip(trip)
                            finish()
                        }
                        .setNegativeButton(R.string.btn_cancel, null)
                        .show()
                }
            }
        }
    }
}