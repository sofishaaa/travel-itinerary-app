package com.example.tripplanner

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.viewModelScope
import com.example.tripplanner.data.Trip
import com.example.tripplanner.data.TripDatabase
import com.example.tripplanner.data.TripRepository
import kotlinx.coroutines.launch

class TripViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: TripRepository
    val allTrips: LiveData<List<Trip>>

    init {
        val dao = TripDatabase.getDatabase(application).tripDao()
        repository = TripRepository(dao)
        allTrips = repository.allTrips
    }

    fun getTripById(id: Int): LiveData<Trip> {
        return repository.getTripById(id)
    }

    fun insertTrip(trip: Trip) = viewModelScope.launch {
        repository.insertTrip(trip)
    }

    fun updateTrip(trip: Trip) = viewModelScope.launch {
        repository.updateTrip(trip)
    }

    fun deleteTrip(trip: Trip) = viewModelScope.launch {
        repository.deleteTrip(trip)
    }
}